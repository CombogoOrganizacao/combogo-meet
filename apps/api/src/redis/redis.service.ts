import { Injectable } from "@nestjs/common";
import { Redis } from "@upstash/redis";

/**
 * Usamos @upstash/redis (protocolo REST) em vez de ioredis/node-redis
 * propositalmente: essas bibliotecas mantêm um socket TCP persistente, o que
 * não combina com funções serverless que sobem e descem a qualquer momento.
 * O cliente REST da Upstash faz uma requisição HTTPS por comando — sem
 * estado de conexão para gerenciar, o que é exatamente o modelo do Vercel.
 */
@Injectable()
export class RedisService {
  readonly client: Redis;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    if (!url || !token) {
      throw new Error(
        "Upstash Redis não configurado: defina UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN nas variáveis de ambiente da API (ex.: Vercel > Settings > Environment Variables)."
      );
    }

    this.client = new Redis({ url, token });
  }
}
