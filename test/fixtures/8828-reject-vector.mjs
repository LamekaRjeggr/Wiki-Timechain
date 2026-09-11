import { CONTEXT, NOTARY, acts } from "./8828-fold-vector.mjs";

const id = number => number.toString(16).padStart(64, "0");
const OTHER_NOTARY = "22".repeat(32);

function copy(event, actId) {
  return { ...structuredClone(event), id: actId };
}

function acceptance(actId, mutate) {
  const event = copy(acts.A, actId);
  mutate(event);
  return event;
}

function snapshotTag(event) {
  return event.tags.find(tag => tag[0] === "snapshot");
}

export const invalid = [
  {
    name: "two marked contexts",
    event: acceptance(id(8), event => {
      event.tags.push(["a", CONTEXT, "", "context"]);
    }),
    spec: "NIP-DRAFT-ACTS.md:71",
  },
  {
    name: "whole-card selector beside a field selector",
    event: acceptance(id(9), event => {
      event.tags.push(["select", "tag:title"]);
    }),
    spec: "NIP-DRAFT-ACTS.md:127-128",
  },
  {
    name: "duplicate field selector",
    event: acceptance(id(10), event => {
      const select = event.tags.find(tag => tag[0] === "select");
      select[1] = "tag:title";
      event.tags.push(["select", "tag:title"]);
    }),
    spec: "NIP-DRAFT-ACTS.md:127",
  },
  {
    name: "snapshot id differs from source edge",
    event: acceptance(id(11), event => {
      const source = event.tags.find(tag => tag[0] === "e" && tag[3] === "source");
      source[1] = acts.B.tags.find(tag => tag[0] === "e")[1];
    }),
    spec: "NIP-DRAFT-ACTS.md:171",
  },
  {
    name: "snapshot kind is not 30828",
    event: acceptance(id(12), event => {
      const snapshot = JSON.parse(snapshotTag(event)[1]);
      snapshot.kind = 1;
      snapshotTag(event)[1] = JSON.stringify(snapshot);
    }),
    spec: "NIP-DRAFT-ACTS.md:170",
  },
  {
    name: "missing snapshot",
    event: acceptance(id(13), event => {
      event.tags = event.tags.filter(tag => tag[0] !== "snapshot");
    }),
    spec: "NIP-DRAFT-ACTS.md:73",
  },
  {
    name: "unsupported selector",
    event: acceptance(id(14), event => {
      event.tags.find(tag => tag[0] === "select")[1] = "tag:image";
    }),
    spec: "NIP-DRAFT-ACTS.md:108-117",
  },
  {
    name: "acceptance has no selector",
    event: acceptance(id(15), event => {
      event.tags = event.tags.filter(tag => tag[0] !== "select");
    }),
    spec: "NIP-DRAFT-ACTS.md:74",
  },
  {
    name: "acceptance signer differs from context notary",
    event: acceptance(id(16), event => {
      event.pubkey = OTHER_NOTARY;
      event.created_at = 0;
    }),
    spec: "NIP-DRAFT-ACTS.md:189",
  },
  {
    name: "revoke target is not an acceptance",
    event: {
      id: id(17),
      pubkey: NOTARY,
      created_at: 700,
      kind: 8828,
      tags: [
        ["a", CONTEXT, "", "context"],
        ["e", acts.K5.id, "", "revoke"],
      ],
      content: "",
      sig: "aa".repeat(64),
    },
    spec: "NIP-DRAFT-ACTS.md:158",
  },
  {
    name: "two marked source edges",
    event: acceptance(id(18), event => {
      const source = event.tags.find(tag => tag[0] === "e" && tag[3] === "source");
      event.tags.push(structuredClone(source));
    }),
    spec: "NIP-DRAFT-ACTS.md:72",
  },
  {
    name: "two complete snapshots",
    event: acceptance(id(19), event => {
      event.tags.push(structuredClone(snapshotTag(event)));
    }),
    spec: "NIP-DRAFT-ACTS.md:73",
  },
  {
    name: "acceptance content is not empty",
    event: acceptance(id(20), event => {
      event.content = "second value channel";
    }),
    spec: "NIP-DRAFT-ACTS.md:53",
  },
  {
    name: "unmarked context tag",
    event: acceptance(id(21), event => {
      event.tags.push(["context", CONTEXT]);
    }),
    spec: "NIP-DRAFT-ACTS.md:76",
  },
  {
    name: "source-card coordinate tag",
    event: acceptance(id(22), event => {
      event.tags.push(["a", `30828:${OTHER_NOTARY}:source-card`]);
    }),
    spec: "NIP-DRAFT-ACTS.md:76",
  },
  {
    name: "slot tag",
    event: acceptance(id(23), event => {
      event.tags.push(["slot", "slot-x"]);
    }),
    spec: "NIP-DRAFT-ACTS.md:76",
  },
];
