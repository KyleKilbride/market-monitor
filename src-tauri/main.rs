#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn fetch_feeds() -> Result<Vec<FeedItem>, String> {
  // Implement feed fetching
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![fetch_feeds])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
} 