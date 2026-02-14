// Convert SRT into VTT for <video> support.
/*
use rsubs_lib::SRT;
match SRT::parse(&srt_content) {
    Ok(srt) => {
        let vtt_content = srt.to_vtt().to_string();
        let output_path = MEDIA_ROOT.join("vid-test/track2.vtt");
        std::fs::write(output_path, vtt_content).unwrap();
    }
    Err(e) => {
        println!("Failed to convert srt file: {:?}", e);
    }
}
 */