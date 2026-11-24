import {
  decode,
  encode,
  AUTHORITATIVE_ANSWER,
  type Question,
  type Answer,
} from '@dnsquery/dns-packet'

export interface DecodedQuery {
  id: number
  question: Question
}

export function decodeQuery(bytes: Uint8Array): DecodedQuery {
  const packet = decode(bytes)
  const question = packet.questions?.[0]
  if (!question) {
    throw new Error('DNS query has no question')
  }
  return { id: packet.id ?? 0, question }
}

export interface ResponseInput {
  id: number
  question?: Question
  rcode: 'NOERROR' | 'FORMERR' | 'REFUSED' | 'SERVFAIL'
  answers: Answer[]
}

const rcodeValues: Record<ResponseInput['rcode'], number> = {
  NOERROR: 0,
  FORMERR: 1,
  REFUSED: 5,
  SERVFAIL: 2,
}

export function encodeResponse(input: ResponseInput): Uint8Array {
  const rcodeValue = rcodeValues[input.rcode]
  const flags = AUTHORITATIVE_ANSWER | rcodeValue

  return encode({
    type: 'response',
    id: input.id,
    flags,
    questions: input.question ? [input.question] : [],
    answers: input.answers,
  })
}
