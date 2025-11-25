import { ObjectFieldTemplateProps } from "@rjsf/utils";
import { Fragment } from "react";

export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  return (
    <>
      {props.properties.map((element, idx) => (
        <Fragment key={element.name + idx}>{element.content}</Fragment>
      ))}
    </>
  );
};
