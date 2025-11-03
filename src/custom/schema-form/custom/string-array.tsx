import { WidgetProps } from "@rjsf/utils";
import { Tag, TagInput } from "emblor";
import { useEffect, useState } from "react";
import { fieldOptionsByDependency } from "../utils/dependency";
import { FieldLabel } from "./label";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { beautifyLabel } from "../utils";

export function StringArrayItem(props: WidgetProps) {
  const {
    id,
    label,
    classNames,
    onChange,
    value = [],
    disabled,
    uiSchema,
    required,
  } = props;

  const dependencyOptions = fieldOptionsByDependency(
    uiSchema,
    props.formContext,
  );
  const fieldOptions = {
    disabled,
    required,
    ...dependencyOptions,
  };
  if (fieldOptions.hidden) {
    onChange(undefined);
    return null;
  }

  const [exampleTags, setExampleTags] = useState<Tag[]>(
    value.map((tag: string) => ({
      id: Math.random().toString(36).substring(2, 15),
      text: tag,
    })),
  );
  useEffect(() => {
    onChange(exampleTags.map((tag) => tag.text));
  }, [exampleTags]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  return (
    <div
      className={cn(
        "w-full grid gap-1.5 h-fit",
        uiSchema?.["ui:className"],
        classNames,
      )}
    >
      <FieldLabel id={id} label={label} required={required} />
      <TagInput
        tags={exampleTags}
        setTags={(newTags) => {
          setExampleTags(newTags);
        }}
        placeholder={
          uiSchema?.["ui:placeholder"] ||
          `Please enter a ${beautifyLabel(label)}`
        }
        styleClasses={{
          input: "w-full sm:max-w-[350px] shadow-none",
        }}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        variant="default"
      />
    </div>
  );
}
