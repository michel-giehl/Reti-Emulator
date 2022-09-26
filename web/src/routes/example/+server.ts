import type { RequestEvent, RequestHandler } from "@sveltejs/kit";
import { json } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET(event: RequestEvent) {
  const language = event.request.headers.get("language")
  switch (language) {
    case "picoc":
      return json(["fibonacci"])

    case "reti":
      return json([
        "fibonacci",
        "fibonacci_additions",
        "uart_send",
      ])
    default:
      return json([])
  }
}
