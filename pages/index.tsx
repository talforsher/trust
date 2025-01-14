import React from "react";
import { Redis } from "@upstash/redis";

export async function getServerSideProps() {
  try {
    const redis = Redis.fromEnv();
    // get all keys with the prefix "player:"
    const keys = await redis.keys("player:*");
    const values = await redis.mget(keys);
    return { props: { keys, values } };
  } catch (error) {
    console.error(error);
    return { props: { keys: [], values: [] } };
  }
}

export default function Home({
  keys,
  values,
}: {
  keys: string[];
  values: string[];
}) {
  return (
    <div>
      <h1>Keys</h1>
      <pre>{JSON.stringify(keys, null, 2)}</pre>
      <h1>Values</h1>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}
