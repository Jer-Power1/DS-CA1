
import type { APIGatewayProxyEvent } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../lambdas/app/add-movie-role";
import { ddb } from "../lambdas/shared/db";

jest.mock("../lambdas/shared/db", () => ({
  ...jest.requireActual("../lambdas/shared/model"),
  ddb: { send: jest.fn() },
  tableName: "test-table",
}));

const sendMock = ddb.send as jest.Mock;

const testRole = {
  movieId: 1,
  actorId: 10,
  roleName: "Lead",
  roleDescription: "Main character",
};

const makeEvent = (body: unknown) =>
  ({
    body: JSON.stringify(body),
    isBase64Encoded: false,
  } as APIGatewayProxyEvent);

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({});
});

test("adds a valid movie role", async () => {
  const result = await handler(makeEvent(testRole));
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(201);
  expect(body.data).toEqual(testRole);
  expect(sendMock).toHaveBeenCalledTimes(1);

  const command = sendMock.mock.calls[0][0];
  expect(command).toBeInstanceOf(TransactWriteCommand);

  const items = command.input.TransactItems;

  expect(items[0].ConditionCheck.Key).toEqual({
    PK: "m#1",
    SK: "m#1",
  });

  expect(items[1].ConditionCheck.Key).toEqual({
    PK: "a#10",
    SK: "a#10",
  });

  expect(items[2].Put.Item).toEqual({
    PK: "m#1",
    SK: "a#10",
    ...testRole,
  });
});

test("rejects an invalid movie ID", async () => {
  const result = await handler(
    makeEvent({ ...testRole, movieId: "abc" })
  );

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});

test("rejects an invalid actor ID", async () => {
  const result = await handler(
    makeEvent({ ...testRole, actorId: 0 })
  );

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});

test("rejects an empty role name", async () => {
  const result = await handler(
    makeEvent({ ...testRole, roleName: "" })
  );

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});

test("handles a failed transaction", async () => {
  const error = new Error("Transaction cancelled");
  error.name = "TransactionCanceledException";
  sendMock.mockRejectedValueOnce(error);

  const result = await handler(makeEvent(testRole));

  expect(result.statusCode).toBe(409);
});
