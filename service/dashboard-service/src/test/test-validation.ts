import {
  getLatestValidationsRepository,
} from "../repositories/dashboard.repository.js";

const test = async () => {
  const data = await getLatestValidationsRepository();

  console.log(data);
};

test();