import { InboxControllerApi } from "https://raw.githubusercontent.com/mailslurp/mailslurp-client-deno/11.7.9/index.ts";
import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts";

Deno.test("can create controllers", () => {
    assertEquals(!!InboxControllerApi, true);
})