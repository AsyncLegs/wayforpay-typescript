import { createHmac } from "crypto";
import { each, isArray, isEmpty, union, values } from "lodash";
import fetch from "node-fetch";
import { Actions } from "./actions";
import { Fields } from "./fields";
import { propertyExists, serialize } from "./utils";
export class Wayforpay {
  private PURCHASE_URL = "https://secure.wayforpay.com/pay";
  private API_URL = "https://api.wayforpay.com/api";
  private WIDGET_URL = "https://secure.wayforpay.com/server/pay-widget.js";
  private FIELDS_DELIMITER = ";";
  private API_VERSION = 1;
  private DEFAULT_CHARSET = "utf-8";
  private action: Actions = Actions.INITIAL;
  private fields: any;

  constructor(
    private readonly merchantAccount: string,
    private readonly merchantPassword: string
  ) {}

  /**
   * Return signature hash
   *
   * @param action
   * @param fields
   * @return mixed
   */
  public createSignature(action: Actions, fields: any) {
    this.prepare(action, fields);
    return this.buildSignature();
  }

  /**
   * MODE_SETTLE
   *
   * @param fields
   * @return mixed
   */
  public async settle(fields: any) {
    this.prepare(Actions.SETTLE, fields);
    return await this.api(fields);
  }

  /**
   * MODE_CHARGE
   *
   * @param fields
   * @return mixed
   */
  public async charge(fields: any) {
    this.prepare(Actions.CHARGE, fields);

    return await this.api(fields);
  }

  /**
   * MODE_REFUND
   *
   * @param fields
   * @return mixed
   */
  public async refund(fields: any) {
    this.prepare(Actions.REFUND, fields);
    return await this.api(fields);
  }

  /** MODE_CHECK_STATUS
   *
   * @param fields
   * @return mixed
   */
  public async checkStatus(fields: any) {
    this.prepare(Actions.CHECK_STATUS, fields);
    return await this.api(fields);
  }

  /**
   * COMPLETE_3DS
   *
   * @param fields
   * @return mixed
   */
  public complete3ds(fields: any) {
    this.prepare(Actions.COMPLETE_3DS, fields);
    return this.api(fields);
  }
  /**
   * MODE_P2P_CREDIT
   *
   * @param fields
   * @return mixed
   */
  public async account2card(fields: any) {
    this.prepare(Actions.P2P_CREDIT, fields);
    return await this.api(fields);
  }

  /**
   * MODE_P2P_CREDIT
   *
   * @param fields
   * @return mixed
   */
  public async createInvoice(fields: any) {
    this.prepare(Actions.CREATE_INVOICE, fields);
    return await this.api(fields);
  }

  /**
   * MODE_P2P_CREDIT
   *
   * @param fields
   * @return mixed
   */
  public account2phone(fields: any) {
    this.prepare(Actions.P2_PHONE, fields);
    return this.api(fields);
  }

  /**
   * MODE_PURCHASE
   * Generate html form
   *
   * @param fields
   * @return string
   */
  public buildForm(fields: any, submitTitle: string): string {
    this.prepare(Actions.PURCHASE, fields);
    const inputs: string[] = [];
    each(fields, (value, key) => {
      if (isArray(key)) {
        each(key, field => {
          inputs.push(
            `<input type="hidden" name="${key}[]" value="${field}" />`
          );
        });
      } else {
        inputs.push(`<input type="hidden" name="${key}[]" value="${value}" />`);
      }
    });
    return `<form method="POST" action="${
      this.PURCHASE_URL
    }" accept-charset="utf-8">${inputs.join(
      ""
    )}<input type="submit" value="${submitTitle}"></form>`.trim();
  }
  /**
   * MODE_PURCHASE
   * If GET redirect is used to redirect to purchase form, i.e.
   * https://secure.wayforpay.com/pay/get?merchantAccount=test_merch_n1&merchantDomainName=domain.ua&merchantSignature=c6d08855677ec6beca68e292b2c3c6ae&orderReference=RG3656-1430373125&orderDate=1430373125&amount=0.16&currency=UAH&productName=Saturn%20BUE%201.2&productPrice=0.16&productCount=1&language=RU
   *
   * @param fields
   * @return string
   */
  public generatePurchaseUrl(fields: any): string {
    this.prepare(Actions.PURCHASE, fields);
    return `${this.PURCHASE_URL}/get?${serialize(fields)}`;
  }

  /**
   *
   * @param fields
   * @param buttonCaption
   * @param callback
   * @returns String
   */
  public buildWidgetButton(
    fields: any,
    buttonCaption: string,
    callback = null
  ): string {
    this.prepare(Actions.PURCHASE, fields);
    return `
    <script id="widget-wfp-script" language="javascript" type="text/javascript" src="${
      this.WIDGET_URL
    }">
    </script>

    <script type="text/javascript">
    var wayforpay = new Wayforpay();
    var pay = function () {
      wayforpay.run(${JSON.stringify(this.fields)});
    }

    window.addEventListener("message", ${
      callback ? callback : "receiveMessage"
    } );

    function receiveMessage(event){
      if(
        event.data == "WfpWidgetEventClose" ||      //при закрытии виджета пользователем
        event.data == "WfpWidgetEventApproved" ||   //при успешном завершении операции
        event.data == "WfpWidgetEventDeclined" ||   //при неуспешном завершении
        event.data == "WfpWidgetEventPending" // транзакция на обработке
        )      
        {
          console.log(event.data);
        }
    }
    </script>
    <button type="button" onclick="pay();">${buttonCaption}</button>
    `;
  }

  /**
   * Call Wayforpay API
   *
   * @param any fields
   *
   * @return Object
   */
  private async api<T>(fields: any): Promise<any> {
    const body = JSON.stringify(fields);
    try {
      const result = await fetch(this.API_URL, {
        body,
        headers: {
          "Content-Type": `application/json; charset=${this.DEFAULT_CHARSET}`
        },
        method: "post"
      });
      return result.json();
    } catch (e) {
      throw Error(e);
    }
  }

  private prepare(action: Actions, fields: any) {
    if (!action) {
      throw new Error(`Actions must be not empty`);
    }
    this.action = action;
    if (!fields) {
      throw new Error(`Arguments must be not empty`);
    }
    this.fields = fields;
    this.fields.transactionType = action;
    this.fields.merchantAccount = this.merchantAccount;
    this.fields.merchantSignature = this.buildSignature();
    if (this.action !== Actions.PURCHASE) {
      this.fields.apiVersion = this.API_VERSION;
    }
    console.log(this.fields);

    this.checkFields();
  }

  /**
   * _checkFields
   *
   * @param Object fields
   *
   * @return status
   *
   * @throws InvalidArgumentException
   */
  private checkFields() {
    const requiredFields = this.getRequiredFields();
    const errors: any[] = [];
    const parameters: any = this.fields;
    requiredFields.forEach((item: string) => {
      if (propertyExists(item, parameters)) {
        if (!parameters[item]) {
          errors.push(item);
        }
      } else {
        errors.push(item);
      }
    });

    if (!isEmpty(errors)) {
      throw new Error(`Missed required field(s): ${JSON.stringify(errors)}`);
    }

    return true;
  }

  private getFieldsNameForSignature() {
    const purchaseFieldsAlias = [
      "merchantAccount",
      "merchantDomainName",
      "orderReference",
      "orderDate",
      "amount",
      "currency",
      "productName",
      "productCount",
      "productPrice"
    ];
    switch (this.action) {
      case Actions.PURCHASE:
      case Actions.CREATE_INVOICE:
      case Actions.CHARGE:
        return purchaseFieldsAlias;

      case Actions.COMPLETE_3DS:
        return ["transactionType", "authorization_ticket", "d3ds_pares"];

      case Actions.ACCEPT:
        return ["orderReference", "status", "time"];

      case Actions.CHECK_STATUS:
        return ["merchantAccount", "orderReference"];

      case Actions.SETTLE:
      case Actions.REFUND:
        return ["merchantAccount", "orderReference", "amount", "currency"];

      case Actions.P2P_CREDIT:
        return [
          "merchantAccount",
          "orderReference",
          "amount",
          "currency",
          "cardBeneficiary",
          "rec2Token"
        ];
      case Actions.P2_PHONE:
        return [
          "merchantAccount",
          "orderReference",
          "amount",
          "currency",
          "phone"
        ];
      default:
        throw new Error(`Unknown transaction type: ${this.action}`);
    }
  }

  /**
   * buildSignature
   *
   * @param Object fields
   *
   * @return string
   */
  private buildSignature() {
    const signFields = this.getFieldsNameForSignature();
    const data: string[] = [];
    const errors: string[] = [];
    const parameters = this.fields;

    signFields.forEach(item => {
      if (propertyExists(item, parameters)) {
        const value = parameters[item];
        if (isArray(value)) {
          const arrayValue = values(value);
          const str = arrayValue.join(this.FIELDS_DELIMITER);
          data.push(str + "");
        } else {
          data.push(value + "");
        }
      } else {
        errors.push(item);
      }
    });

    if (!isEmpty(errors)) {
      throw new Error(`Missed signature field(s): ${JSON.stringify(errors)}`);
    }
    const allDataValues = values(data);

    return createHmac("md5", this.merchantPassword)
      .update(allDataValues.join(this.FIELDS_DELIMITER))
      .digest("hex");
  }

  private getRequiredFields() {
    switch (this.action) {
      case Actions.PURCHASE:
        return [
          "merchantAccount",
          "merchantDomainName",
          "merchantTransactionSecureType",
          "orderReference",
          "orderDate",
          "amount",
          "currency",
          "productName",
          "productCount",
          "productPrice"
        ];
      case Actions.SETTLE:
        return [
          "transactionType",
          "merchantAccount",
          "orderReference",
          "amount",
          "currency",
          "apiVersion"
        ];
      case Actions.ACCEPT:
        return ["orderReference", "status", "time"];
      case Actions.CHARGE:
        const required = [
          "transactionType",
          "merchantAccount",
          "merchantDomainName",
          "orderReference",
          "apiVersion",
          "orderDate",
          "amount",
          "currency",
          "productName",
          "productCount",
          "productPrice"
        ];
        const additional = this.fields["recToken"]
          ? ["recToken"]
          : ["card", "expMonth", "expYear", "cardCvv", "cardHolder"];
        return union(required, additional);
      case Actions.REFUND:
        return [
          "transactionType",
          "merchantAccount",
          "orderReference",
          "amount",
          "currency",
          "comment",
          "apiVersion"
        ];
      case Actions.CHECK_STATUS:
        return [
          "transactionType",
          "merchantAccount",
          "orderReference",
          "apiVersion"
        ];
      case Actions.COMPLETE_3DS:
        return ["transactionType", "authorization_ticket", "d3ds_pares"];
      case Actions.P2P_CREDIT:
        return [
          "transactionType",
          "merchantAccount",
          "orderReference",
          "amount",
          "currency",
          "cardBeneficiary",
          "merchantSignature"
        ];
      case Actions.CREATE_INVOICE:
        return [
          "transactionType",
          "merchantAccount",
          "merchantDomainName",
          "orderReference",
          "amount",
          "currency",
          "productName",
          "productCount",
          "productPrice"
        ];
      case Actions.P2_PHONE:
        return [
          "merchantAccount",
          "orderReference",
          "orderDate",
          "currency",
          "amount",
          "phone",
          "apiVersion"
        ];
      default:
        throw new Error(`Unknown transaction type`);
    }
  }
}
