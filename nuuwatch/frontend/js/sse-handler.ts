export async function createSSEPostRequest(url: string, data: unknown, maxTimeoutMs: number = 20 * 60 * 1000): Promise<void> {
  console.log(`Creating SSE Request... to ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Accept": "text/event-stream",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok || !response.body) {
    throw new Error(response.statusText);
  }

  let finished = false;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  const timeoutId = setTimeout(() => {
    if (!finished) {
      reader.cancel("Timed out.").then();
      finished = true;
    }
  }, maxTimeoutMs);

  let lineBuffer: string[] = [''];
  let lineBufferIndex = 0;

  while (true) {
    if (finished) {
      break;
    }

    const {value, done} = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      console.log('No value from reader', value);
      continue;
    }

    for (const letter of value) {
      if (letter === '\n') {
        // Don't increase if multiple \n in a row.
        if (lineBuffer[lineBufferIndex] !== '') {
          lineBufferIndex++;
          lineBuffer[lineBufferIndex] = '';
        }
        continue;
      }

      lineBuffer[lineBufferIndex] += letter;
    }

    while (lineBufferIndex >= 2) {
      lineBufferIndex -= 2;
      const eventText = lineBuffer.shift() ?? '';
      const dataText = lineBuffer.shift() ?? '';

      if (!eventText.startsWith('event: ') || (dataText && !dataText.startsWith('data: '))) {
        console.log('event or data did not start with expected prefix', eventText, dataText);
        continue;
      }

      const event = eventText.substring('event: '.length);
      const data = dataText.substring('data: '.length);

      const time = new Date();
      // For hh:mm:ss format.
      let timeString = time.toLocaleTimeString('sv');
      console.log(`${timeString}: event: '${event}'`, `data: '${data}'`);
    }
  }
  clearTimeout(timeoutId);
}