export type XapiEnumValue = {
  name: string;
  doc: string;
}

export type XapiEnum = {
  name: string;
  values: XapiEnumValue[];
}

export type XapiMessageError = {
  name: string;
  doc: string;
}

export type XapiMessageParam = {
  type: string;
  name: string;
  doc: string;
}

export type XapiMessage= {
  name: string;
  description: string;
  result: [type: string, description: string];
  params: XapiMessageParam[]
  errors: XapiMessageError[];
  roles: string[];
  tag: string;
  lifecycle: XapiLifecycle;
  implicit: boolean;
}

export type XapiTransition = {
  transition: string;
  release: string;
  description: string;
}

export type XapiLifecycle = {
  state: string;
  transitions: XapiTransition[];
}

export type XapiField = {
  name: string;
  description: string;
  type: string;
  qualifier: string;
  tag: string;
  lifecycle: XapiLifecycle;
  default?: string;
}

export type XapiItem = {
  name: string;
  description: string;
  fields: XapiField[];
  messages: XapiMessage[];
  enums: XapiEnum[];
  lifecycle: XapiLifecycle;
  tag: string;
}
