import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  ddb,
  isRoleItem,
  movieKey,
  parseId,
  tableName,
  toRole,
} from "../shared/db";
import { response } from "../shared/http";
import { logRequest } from "../shared/request-logger";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logRequest(event);

  const movieId = parseId(event.pathParameters?.movieID);
  if (movieId === undefined) {
    return response(400, { message: "movieID must be a positive integer" });
  }

  
  const actorParam = event.queryStringParameters?.actor;
  const actorId = actorParam === undefined ? undefined : parseId(actorParam);

  if (actorParam !== undefined && actorId === undefined) {
    return response(400, { message: "actor must be a positive integer" });
  }

  try {
    const queryResult = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": movieKey(movieId) },
        // ExclusiveStartKey: lastKey,
      })
    );

    

    
    const resultItems = queryResult.Items ?? [];
    const roles = resultItems.filter(isRoleItem).map(toRole);

    const filteredRoles =
      actorId === undefined
        ? roles
        : roles.filter((role) => role.actorId === actorId);

    return response(200, { data: filteredRoles });


    return response(200, { data: roles });

  } catch (err) {
    console.error("DynamoDB error:", err);
    return response(500, {
      message: "Internal server error",
      error: err,
    });
  }
};
