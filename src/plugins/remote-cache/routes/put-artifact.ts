import type { Server } from 'http'
import type { RouteOptions, RawRequestDefaultExpression, RawReplyDefaultExpression } from 'fastify'
import { preconditionFailed } from '@hapi/boom'
import { type Querystring, type Params, artifactsRouteSchema } from './schema'

export const putArtifact: RouteOptions<
  Server,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  {
    Querystring: Querystring
    Params: Params
    Body: Buffer
  }
> = {
  url: '/artifacts/:id',
  method: 'PUT',
  schema: artifactsRouteSchema,
  async handler(req, reply) {
    const artifactId = req.params.id
    const teamId = req.query.teamId
    try {
      const artifactUrl = await this.location.createCachedArtifact(artifactId, teamId, req.body)
      reply.send({ urls: [`${teamId}/${artifactUrl}`] })
    } catch (err) {
      // we need this error throw since turbo retries if the error is in 5xx range
      throw preconditionFailed(`Error during the artifact creation`, err)
    }
  },
}
