import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionsHandler");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    const cause =
      exception instanceof Error && "cause" in exception
        ? (exception as Error & { cause?: unknown }).cause
        : undefined;

    if (cause) {
      const causeMessage =
        cause instanceof Error ? cause.message : String(cause);
      const causeCode =
        cause && typeof cause === "object" && "code" in cause
          ? ` (${String((cause as { code?: unknown }).code)})`
          : "";
      this.logger.error(
        `${exception instanceof Error ? exception.message : String(exception)} - causa: ${causeMessage}${causeCode}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined
      );
    }

    response.status(status).json(
      typeof message === "string" ? { statusCode: status, message } : message
    );
  }
}
