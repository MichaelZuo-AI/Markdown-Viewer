use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::State;

pub struct OpenFileState {
    pub pending: Mutex<Vec<String>>,
    pub frontend_ready: AtomicBool,
}

#[tauri::command]
pub fn get_opened_files(state: State<'_, OpenFileState>) -> Vec<String> {
    state.frontend_ready.store(true, Ordering::SeqCst);
    let mut pending = state.pending.lock().unwrap_or_else(|e| e.into_inner());
    pending.drain(..).collect()
}

// ---------------------------------------------------------------------------
// Unit tests
//
// The `get_opened_files` Tauri command requires a `State<'_, OpenFileState>`
// which comes from the Tauri runtime and cannot be constructed outside of it.
// We therefore test the underlying *logic* directly on `OpenFileState` values
// using the same std-library primitives (Mutex, AtomicBool) without invoking
// the Tauri command dispatcher.
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // Helper: build a fresh OpenFileState with the given initial paths.
    fn make_state(paths: Vec<&str>, ready: bool) -> OpenFileState {
        OpenFileState {
            pending: Mutex::new(paths.into_iter().map(String::from).collect()),
            frontend_ready: AtomicBool::new(ready),
        }
    }

    // -- OpenFileState construction -------------------------------------------

    #[test]
    fn new_state_frontend_ready_starts_false() {
        let state = make_state(vec![], false);
        assert!(!state.frontend_ready.load(Ordering::SeqCst));
    }

    #[test]
    fn new_state_pending_starts_empty() {
        let state = make_state(vec![], false);
        let pending = state.pending.lock().unwrap();
        assert!(pending.is_empty());
    }

    // -- frontend_ready flag --------------------------------------------------

    #[test]
    fn setting_frontend_ready_true_is_visible_across_loads() {
        let state = make_state(vec![], false);
        state.frontend_ready.store(true, Ordering::SeqCst);
        assert!(state.frontend_ready.load(Ordering::SeqCst));
    }

    #[test]
    fn frontend_ready_can_start_pre_set_to_true() {
        let state = make_state(vec![], true);
        assert!(state.frontend_ready.load(Ordering::SeqCst));
    }

    // -- pending buffer (mirrors the buffer logic in lib.rs) ------------------

    #[test]
    fn extending_pending_adds_all_paths() {
        let state = make_state(vec![], false);
        {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(vec!["/a.md".to_string(), "/b.md".to_string()]);
        }
        let pending = state.pending.lock().unwrap();
        assert_eq!(*pending, vec!["/a.md", "/b.md"]);
    }

    #[test]
    fn extending_pending_multiple_times_accumulates_paths() {
        let state = make_state(vec![], false);
        {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(vec!["/first.md".to_string()]);
        }
        {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(vec!["/second.md".to_string()]);
        }
        let pending = state.pending.lock().unwrap();
        assert_eq!(*pending, vec!["/first.md", "/second.md"]);
    }

    // -- drain (the return-and-clear logic of get_opened_files) ---------------

    #[test]
    fn drain_returns_all_pending_paths() {
        let state = make_state(vec!["/a.md", "/b.md", "/c.md"], false);
        let drained: Vec<String> = {
            let mut pending = state.pending.lock().unwrap();
            pending.drain(..).collect()
        };
        assert_eq!(drained, vec!["/a.md", "/b.md", "/c.md"]);
    }

    #[test]
    fn drain_leaves_pending_empty() {
        let state = make_state(vec!["/a.md", "/b.md"], false);
        {
            let mut pending = state.pending.lock().unwrap();
            let _: Vec<String> = pending.drain(..).collect();
        }
        let pending = state.pending.lock().unwrap();
        assert!(pending.is_empty());
    }

    #[test]
    fn drain_on_empty_pending_returns_empty_vec() {
        let state = make_state(vec![], false);
        let drained: Vec<String> = {
            let mut pending = state.pending.lock().unwrap();
            pending.drain(..).collect()
        };
        assert!(drained.is_empty());
    }

    #[test]
    fn drain_is_idempotent_second_call_returns_empty() {
        let state = make_state(vec!["/only.md"], false);
        // First drain
        {
            let mut pending = state.pending.lock().unwrap();
            let _: Vec<String> = pending.drain(..).collect();
        }
        // Second drain — must be empty now
        let drained: Vec<String> = {
            let mut pending = state.pending.lock().unwrap();
            pending.drain(..).collect()
        };
        assert!(drained.is_empty());
    }

    // -- combined: the full sequence get_opened_files performs ----------------
    //
    // We simulate the command body manually:
    //   1. store(true) on frontend_ready
    //   2. drain pending and collect

    #[test]
    fn simulated_get_opened_files_sets_ready_flag_and_returns_paths() {
        let state = make_state(vec!["/doc.md", "/notes.md"], false);

        // Simulate what get_opened_files does
        state.frontend_ready.store(true, Ordering::SeqCst);
        let result: Vec<String> = {
            let mut pending = state.pending.lock().unwrap();
            pending.drain(..).collect()
        };

        assert!(state.frontend_ready.load(Ordering::SeqCst));
        assert_eq!(result, vec!["/doc.md", "/notes.md"]);
    }

    #[test]
    fn simulated_get_opened_files_with_empty_pending_sets_ready_and_returns_empty() {
        let state = make_state(vec![], false);

        state.frontend_ready.store(true, Ordering::SeqCst);
        let result: Vec<String> = {
            let mut pending = state.pending.lock().unwrap();
            pending.drain(..).collect()
        };

        assert!(state.frontend_ready.load(Ordering::SeqCst));
        assert!(result.is_empty());
    }

    // -- branching logic from lib.rs (RunEvent::Opened handler) --------------
    //
    // We cannot run the full Tauri event loop, but we can test the two branches
    // of the if/else: "emit if ready, buffer if not" using the same state type.

    #[test]
    fn when_frontend_not_ready_paths_are_buffered_not_emitted() {
        let state = make_state(vec![], false);
        let paths = vec!["/opened.md".to_string()];

        // Branch: frontend not ready → extend pending
        if state.frontend_ready.load(Ordering::SeqCst) {
            // In real code this emits; we panic here to catch a logic error
            panic!("should not reach emit branch when not ready");
        } else {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(paths.clone());
        }

        let pending = state.pending.lock().unwrap();
        assert_eq!(*pending, paths);
    }

    #[test]
    fn when_frontend_ready_paths_are_not_buffered() {
        let state = make_state(vec![], true);
        let paths = vec!["/opened.md".to_string()];

        // Branch: frontend ready → emit (we record whether emit branch was taken)
        let mut emit_called = false;
        if state.frontend_ready.load(Ordering::SeqCst) {
            // Represents app_handle.emit("file-open", &paths) — not testable without
            // a real Tauri AppHandle, but we verify the branch is taken and nothing
            // is written to pending.
            emit_called = true;
            let _ = &paths; // consume so compiler doesn't warn
        } else {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(paths);
        }

        assert!(emit_called);
        let pending = state.pending.lock().unwrap();
        assert!(pending.is_empty());
    }

    #[test]
    fn empty_paths_vec_is_not_buffered() {
        // Mirrors the `if paths.is_empty() { return; }` guard in lib.rs
        let state = make_state(vec![], false);
        let paths: Vec<String> = vec![];

        if !paths.is_empty() {
            let mut pending = state.pending.lock().unwrap();
            pending.extend(paths);
        }

        let pending = state.pending.lock().unwrap();
        assert!(pending.is_empty());
    }
}
