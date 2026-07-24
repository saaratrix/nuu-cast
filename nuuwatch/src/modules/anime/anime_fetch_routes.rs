use std::convert::Infallible;
use std::time::Duration;
use axum::Json;
use axum::response::Sse;
use axum::response::sse::{Event};
use nuufetch::fetch_item::{fetch_resource, FetchItem};
use serde::Serialize;
use tokio::sync::mpsc;
use tokio_stream::{Stream, StreamExt};
use tokio_stream::wrappers::ReceiverStream;

#[derive(Debug, Serialize)]
struct ProgressEvent {
    step: u32,
    message: String,
}

#[derive(Debug, Serialize)]
struct FetchResult {
    success: bool,
    target_name: String,
    url: String,
}

pub async fn post_anime_fetch(
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

        let _ = fetch_resource(&item, &mut on_message).await;

        let result = FetchResult {
            success: true,
            target_name: item.target_name,
            url: item.url,
        };

        let finished_data = serde_json::to_string(&result).unwrap();
        let finished_event = Event::default()
            .event("progress")
            .data(finished_data);

       let _ =  message_tx.send(Ok(finished_event)).await;
    });

    let event_stream = ReceiverStream::new(message_rx)
        .timeout(Duration::from_secs(10))
        .take_while(|result| result.is_ok())
        .map(|result| result.expect("Timeout already happened, this is a message that can't happen, right?"));

    Sse::new(event_stream)
}