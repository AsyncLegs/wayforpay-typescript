import { Wayforpay } from "../wayforpay";
import {
  configurationAccount2Card,
  configurationBuildForm,
  expectedBuiltForm
} from "./mocks.json";
let wayForPay: Wayforpay;
beforeAll(() => {
  wayForPay = new Wayforpay("test_merch_n1", "flk3409refn54t54t*FNJRET");
});
test("Wayforpay instantiated correctly", () => {
  expect(wayForPay).toBeInstanceOf(Wayforpay);
});
test("Build form method works as expected", () => {
  expect(wayForPay.buildForm(configurationBuildForm, "Pay some")).toEqual(
    expectedBuiltForm
  );
});
test("Account 2 card payment works as expected", async () => {
  wayForPay = new Wayforpay("p2p_credit", "");

  const paymentAccount2Card = await wayForPay.account2card(
    configurationAccount2Card
  );
  console.log(paymentAccount2Card);

  // expect(paymentAccount2Card).toEqual(expectedBuiltForm);
});
