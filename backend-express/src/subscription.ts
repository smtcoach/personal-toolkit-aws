import { randomUUID } from "node:crypto";
import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { config } from "./config.js";
import { dynamodb } from "./dynamodb.js";

export async function addSubscription(userId: string, name: string, cost: string, date: string) {
    //userId 就是congito的sub，用作用户隔离即可
    const SubsId = randomUUID();
    const item = {
        PK: `USER#${userId}`,
        SK: `SUBS#${SubsId}`,
        name: name,
        cost: cost,
        date: date
    };
    await dynamodb.send(
        new PutCommand({
            TableName: config.subscriptionsTableName,
            Item: item
        })
    );
    return {
        SK: `SUBS#${SubsId}`,
        name: name,
        cost: cost,
        date: date
    };
}

