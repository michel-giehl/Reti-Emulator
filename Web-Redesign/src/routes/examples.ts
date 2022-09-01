import type { RequestEvent, RequestHandler } from "@sveltejs/kit";
import fs from "fs/promises";

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get(event: RequestEvent) {
  const language = event.request.headers.get("language")

  switch (language) {
    case "picoc":
      return {
        status: 200,
        body: [
          "fibonacci"
        ]
      }
    case "reti":
      return {
        status: 200,
        body: [
          "fibonacci",
          "fibonacci_additions",
          "uart_send",
          "uart_receive"
        ]
      }
    default:
      return {
        status: 400,
        body: "Missing header 'Language'"
      }
  }
}
