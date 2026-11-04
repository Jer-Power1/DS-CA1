
import type { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../lambdas/app/get-movie-roles";
import { ddb } from "../lambdas/shared/db";

jest.mock("../lambdas/shared/db", () => ({
  ...jest.requireActual("../lambdas/shared/model"),
  ddb: { send: jest.fn() },
  tableName: "test-table",
}));

const sendMock = ddb.send as jest.Mock;

const testRoles = [
  {
    PK: "m#1",
    SK: "a#10",
    movieId: 1,
    actorId: 10,
    roleName: "Lead",
    roleDescription: "Main character",
  },
  {
    PK: "m#1",
    SK: "a#20",
    movieId: 1,
    actorId: 20,
    roleName: "Supporting",
    roleDescription: "Supporting character",
  },
];

const makeEvent = (actor?: string) =>
  ({
    pathParameters: { movieID: "1" },
    queryStringParameters:
      actor === undefined ? null : { actor },
  } as unknown as APIGatewayProxyEvent);

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ Items: testRoles });
});

test("returns all roles when no actor is provided", async () => {
  const result = await handler(makeEvent());
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(200);
  expect(body.data).toHaveLength(2);
});

test("returns only roles for the requested actor", async () => {
  const result = await handler(makeEvent("10"));
  const body = JSON.parse(result.body);

  expect(result.statusCode).toBe(200);
  expect(body.data).toHaveLength(1);
  expect(body.data[0].actorId).toBe(10);
});

test("returns 400 for an invalid actor ID", async () => {
  const result = await handler(makeEvent("abc"));

  expect(result.statusCode).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});
