use std::convert::Infallible;
use std::time::Duration;
use axum::extract::State;
use axum::Json;
use axum::response::{Sse};
use axum::response::sse::{Event};
use nuufetch::fetch_item::{fetch_resource, FetchItem};
use tokio::sync::mpsc;
use tokio_stream::{Stream, StreamExt};
use tokio_stream::wrappers::ReceiverStream;
use crate::AppState;
use crate::nuucast_api::nuucast_api::upload_file;

pub async fn post_anime_fetch(
    State(state): State<AppState>,
    Json(item): Json<FetchItem>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {

    let (message_tx, message_rx) =
        mpsc::channel::<Result<Event, Infallible>>(32);

    tokio::spawn(async move {
        let mut on_message = |message: &str| {
            let event = Event::default()
                .event("progress")
                .data(message);

            let _ = message_tx.try_send(Ok(event));
        };

        let files = fetch_resource(&item, &mut on_message).await.unwrap();
        if files.len() != 1 {
            return Err("Too many files fetched.");
        }
        let file = files.get(0).unwrap();

        let bytes = match tokio::fs::read(&file).await {
            Ok(bytes) => bytes,
            Err(error) => {
                let error_message = format!(
                    "Failed to read fetched resource file {}: {}",
                    file.display(),
                    error
                );

                on_message(&error_message);
                return Err("Failed to read fetched resource file");
            }
        };

        let full_path = format!("{}/{}", &item.base_name, &item.file_name);
        let uploaded_paths = upload_file(&state.nuucast, &full_path, bytes).await.unwrap();

        let finished_data = serde_json::to_string(&uploaded_paths).unwrap();

        let finished_event = Event::default()
            .event("finished")
            .data(finished_data);
       let _ =  message_tx.send(Ok(finished_event)).await;

        Ok(())
    });

    let event_stream = ReceiverStream::new(message_rx)
        .timeout(Duration::from_secs(10))
        .take_while(|result| result.is_ok())
        .map(|result| result.expect("Timeout already happened, this is a message that can't happen, right?"));

    Sse::new(event_stream)
}
