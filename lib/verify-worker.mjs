// The gate's arms: one worker per core takes [id, event] and answers [id, ok]. Pure; nothing else runs here.
import { verifyEvent } from "./verify.mjs";
onmessage = async ({ data:[id, ev] }) => postMessage([id, await verifyEvent(ev)]);
