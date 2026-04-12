use std::path::PathBuf;

pub fn can_have_connected_file(extension: &str) -> bool {
    match (extension) {
        // It can include the tracks.
        ".mkv" | ".mp4" => true,
        _ => false,
    }
}

pub fn create_connected_file(filepath: &PathBuf, lines: &Vec<&str>) {

}