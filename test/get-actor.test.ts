
import type { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../lambdas/app/get-actor";
import { ddb } from "../lambdas/shared/db";

jest.mock("../lambdas/shared/db", () => ({
  ...jest.requireActual("../lambdas/shared/model"),
  ddb: { send: jest.fn() },
  tableName: "test-table",
}));

const sendMock = ddb.send as jest.Mock;

const testActor = {
  PK: "a#10",
  SK: "a#10",
  actorId: 10,
  name: "Test Actor",
  dateOfBirth: "1990-01-01",
  bio: "Test biography",
};

const testRole = {
  PK: "m#1",
  SK: "a#10",
  movieId: 1,
  actorId: 10,
  roleName: "Lead",
  roleDescription: "Main character",
};

const makeEvent = (actorID: string, movie?: string) =>
  ({
    pathParameters: { actorID },
    queryStringParameters:
      movie === undefined ? null : { movie },
  } as unknown as APIGatewayProxyEvent);

beforeEach(() => {
  sendMock.mockReset();
});

test("returns actor details without a movie parameter", async () => {
  sendMock.mockResolvedValueOnce({ Item: testActor });

  const result = await handler(makeEvent("10"));
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(200);
  expect(body.data.actorId).toBe(10);
  expect(body.data.name).toBe("Test Actor");
  expect(body.data.role).toBeUndefined();
  expect(sendMock).toHaveBeenCalledTimes(1);
});

test("returns the actor's role for a movie", async () => {
  sendMock
    .mockResolvedValueOnce({ Item: testActor })
    .mockResolvedValueOnce({ Item: testRole });

  const result = await handler(makeEvent("10", "1"));
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(200);
  expect(body.data.actorId).toBe(10);
  expect(body.data.role.roleName).toBe("Lead");
  expect(body.data.role.movieId).toBe(1);
  expect(sendMock).toHaveBeenCalledTimes(2);
  expect(sendMock.mock.calls[1][0].input.Key).toEqual({
    PK: "m#1",
    SK: "a#10",
  });
});

test("returns null when the actor has no role in the movie", async () => {
  sendMock
    .mockResolvedValueOnce({ Item: testActor })
    .mockResolvedValueOnce({});

  const result = await handler(makeEvent("10", "2"));
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(200);
  expect(body.data.role).toBeNull();
});

test("returns 404 when the actor does not exist", async () => {
  sendMock.mockResolvedValueOnce({});

  const result = await handler(makeEvent("999"));

  expect(result.statusCode).toBe(404);
});

test("returns 400 for an invalid actor ID", async () => {
  const result = await handler(makeEvent("abc"));

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});

test("returns 400 for an invalid movie ID", async () => {
  const result = await handler(makeEvent("10", "abc"));

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});
