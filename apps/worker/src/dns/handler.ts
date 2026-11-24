import { DecodedQuery, decodeQuery, encodeResponse } from './codec'
import { Resolver } from './resolver'

export async function processQuery(body: Uint8Array, resolve: Resolver): Promise<Uint8Array> {
  let decoded: DecodedQuery
  try {
    decoded = decodeQuery(body)
  }
  catch {
    return encodeResponse({ id: 0, rcode: 'FORMERR', answers: [] })
  }

  try {
    const { rcode, answers } = await resolve(decoded.question)

    return encodeResponse({
      id: decoded.id,
      question: decoded.question,
      rcode,
      answers,
    })
  }
  catch (err) {
    console.error('DoH resolve/encode failed:', err)

    return encodeResponse({
      id: decoded.id,
      question: decoded.question,
      rcode: 'SERVFAIL',
      answers: [],
    })
  }
}
