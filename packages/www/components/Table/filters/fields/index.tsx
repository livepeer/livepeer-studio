import {
  Box,
  Flex,
  TextField,
  styled,
  Checkbox,
  RadioGroup,
  Radio,
} from "@livepeer/design-system";
import { SelectIcon, NextIcon, CalendarIcon } from "../helpers";
import { useCallback } from "react";
import { Filter, FilterType } from "..";
import { ConditionType, Condition } from "..";
import { format } from "date-fns";

const Select = styled("select", {
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  position: "absolute",
  left: 0,
  top: 0,
  padding: "0px 11px",
  fontSize: "12px",
  lineHeight: "1",
  borderRadius: "4px",
  background: "$loContrast",
  border: "none",
  outline: "none",
  boxShadow: "inset 0 0 0 1px $colors$neutral7",
  "&:focus": {
    border: "none",
    outline: "none",
    boxShadow:
      "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
    "&:-webkit-autofill": {
      boxShadow:
        "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8, inset 0 0 0 100px $colors$green3",
    },
  },
});

const DateInput = styled("input", {
  WebkitAppearance: "none",
  height: "100%",
  maxWidth: "88px",
  position: "absolute",
  paddingLeft: "30px",
  fontSize: "12px",
  fontFamily: "$untitled",
  left: 0,
  top: 0,
  borderRadius: "4px",
  background: "$loContrast",
  border: "none",
  outline: "none",
  boxShadow: "inset 0 0 0 1px $colors$neutral7",
  "&::-webkit-calendar-picker-indicator": {
    position: "absolute",
    left: -18,
    zIndex: 1,
    opacity: "0",
  },
  "&:focus": {
    border: "none",
    outline: "none",
    boxShadow:
      "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
    "&:-webkit-autofill": {
      boxShadow:
        "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8, inset 0 0 0 100px $colors$green3",
    },
  },
});

type Option = {
  label: string;
  value: ConditionType;
};

const options: Record<FilterType, Option[]> = {
  text: [
    // { label: "is equal to", value: "textEqual" },
    { label: "contains", value: "contains" },
  ],
  date: [
    { label: "is equal to", value: "dateEqual" },
    { label: "is between", value: "dateBetween" },
  ],
  number: [
    { label: "is equal to", value: "numberEqual" },
    { label: "is between", value: "numberBetween" },
  ],
  boolean: [{ label: "is true", value: "boolean" }],
};

type ConditionSelectProps = {
  type: FilterType;
  condition: Condition;
  onSelect: (conditionType: ConditionType) => void;
};

const ConditionSelect = ({
  type,
  onSelect,
  condition,
}: ConditionSelectProps) => {
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    onSelect(value);
  }, []);

  return (
    <Box
      css={{
        height: "26px",
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        margin: "0px",
        background: "$loContrast",
      }}>
      <Select onChange={handleChange} value={condition.type}>
        {options[type].map((option, i) => {
          return (
            <option value={option.value} key={i}>
              {option.label}
            </option>
          );
        })}
      </Select>
      <Flex css={{ zIndex: 1, marginRight: "11px" }}>
        <SelectIcon />
      </Flex>
    </Box>
  );
};

type ConditionValueProps = {
  filter: Filter;
  condition: Condition;
  onChange: (newCondition: Condition) => void;
};

const ConditionValue = ({
  filter,
  condition,
  onChange,
}: ConditionValueProps) => {
  switch (condition.type) {
    case "contains":
      // case "textEqual":
      return (
        <Box
          as="label"
          htmlFor={filter.label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          {/* @ts-ignore */}
          <TextField
            id={filter.label}
            onChange={(e) =>
              onChange({ type: condition.type, value: e.target.value })
            }
            value={condition.value}
            css={{
              height: "100%",
              width: "100%",
              padding:
                filter.type === "date" ? "0px 11px 0px 32px" : "0px 11px",
              position: "absolute",
              maxWidth: filter.type === "date" ? "100px" : "",
              left: 0,
              top: 0,
            }}
          />
        </Box>
      );
    case "dateEqual":
      return (
        <Box
          as="label"
          htmlFor={filter.label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
            <CalendarIcon />
          </Box>
          <DateInput
            type="date"
            id={filter.label}
            value={condition.value}
            onChange={(e) =>
              onChange({ type: condition.type, value: e.target.value })
            }
          />
        </Box>
      );
    case "dateBetween":
      return (
        <div
          style={{
            marginTop: "",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}>
          <Box
            as="label"
            htmlFor={filter.label}
            css={{
              height: "26px",
              width: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
              <CalendarIcon />
            </Box>
            <DateInput
              type="date"
              id={filter.label}
              value={condition.value[0]}
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  type: condition.type,
                  value: [value, condition.value[1]],
                });
              }}
            />
          </Box>
          <Box
            as="label"
            htmlFor={filter.label}
            css={{
              height: "26px",
              width: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
              <CalendarIcon />
            </Box>
            <DateInput
              type="date"
              id={filter.label}
              value={condition.value[1]}
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  type: condition.type,
                  value: [condition.value[0], value],
                });
              }}
            />
          </Box>
        </div>
      );
    case "numberEqual":
      return (
        <Box
          as="label"
          htmlFor={filter.label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          {/* @ts-ignore */}
          <TextField
            type="number"
            id={filter.label}
            onChange={(e) =>
              onChange({
                type: condition.type,
                value: parseInt(e.target.value),
              })
            }
            value={condition.value}
            css={{
              height: "100%",
              width: "100%",
              padding:
                filter.type === "date" ? "0px 11px 0px 32px" : "0px 11px",
              position: "absolute",
              maxWidth: filter.type === "date" ? "100px" : "",
              left: 0,
              top: 0,
            }}
          />
        </Box>
      );
    case "numberBetween":
      return (
        <div
          style={{
            marginTop: "",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
          }}>
          <Box
            as="label"
            htmlFor={filter.label}
            css={{
              height: "26px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            {/* @ts-ignore */}
            <TextField
              id={filter.label}
              type="number"
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  type: condition.type,
                  value: [parseInt(value), condition.value[1]],
                });
              }}
              value={condition.value[0]}
              css={{
                height: "100%",
                width: "100%",
                padding:
                  filter.type === "date" ? "0px 11px 0px 32px" : "0px 11px",
                position: "absolute",
                maxWidth: filter.type === "date" ? "100px" : "",
                left: 0,
                top: 0,
              }}
            />
          </Box>
          <Box
            as="label"
            htmlFor={filter.label}
            css={{
              height: "26px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            {/* @ts-ignore */}
            <TextField
              id={filter.label}
              type="number"
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  type: condition.type,
                  value: [condition.value[0], parseInt(value)],
                });
              }}
              value={condition.value[1]}
              css={{
                height: "100%",
                width: "100%",
                padding:
                  filter.type === "date" ? "0px 11px 0px 32px" : "0px 11px",
                position: "absolute",
                maxWidth: filter.type === "date" ? "100px" : "",
                left: 0,
                top: 0,
              }}
            />
          </Box>
        </div>
      );
    case "boolean":
      return (
        <Box
          css={{
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          <RadioGroup
            onValueChange={() => {
              onChange({ type: condition.type, value: !condition.value });
            }}>
            <Box css={{ display: "flex", flexDirection: "column" }}>
              <Box css={{ display: "flex", mb: "$2" }}>
                <Radio
                  placeholder="radio"
                  value="on"
                  id={`${filter.label}-on`}
                  checked={condition.value === true}
                />
                <Box
                  as="label"
                  css={{ pl: "$2", fontSize: "12px", fontWeight: 500 }}
                  htmlFor={`${filter.label}-on`}>
                  {filter.type === "boolean" && filter.labelOn}
                </Box>
              </Box>
              <Box css={{ display: "flex" }}>
                <Radio
                  placeholder="radio"
                  value="off"
                  id={`${filter.label}-off`}
                  checked={condition.value === false}
                />
                <Box
                  as="label"
                  css={{ pl: "$2", fontSize: "12px", fontWeight: 500 }}
                  htmlFor={`${filter.label}-off`}>
                  {filter.type === "boolean" && filter.labelOff}
                </Box>
              </Box>
            </Box>
          </RadioGroup>
        </Box>
      );

    default:
      return null;
  }
};

type FieldContentProps = {
  filter: Filter;
  onConditionChange: (condition: Condition) => void;
};

const FieldContent = ({ filter, onConditionChange }: FieldContentProps) => {
  const handleSelect = useCallback((conditionType: ConditionType) => {
    switch (conditionType) {
      case "contains":
        // case "textEqual":
        onConditionChange({ type: conditionType, value: "" });
        break;
      case "dateEqual":
        onConditionChange({
          type: conditionType,
          value: format(new Date(), "yyyy-MM-dd"),
        });
        break;
      case "dateBetween":
        onConditionChange({
          type: conditionType,
          value: [
            format(new Date(), "yyyy-MM-dd"),
            format(new Date(), "yyyy-MM-dd"),
          ],
        });
        break;
      case "numberEqual":
        onConditionChange({
          type: conditionType,
          value: 0,
        });
        break;
      case "numberBetween":
        onConditionChange({
          type: conditionType,
          value: [0, 0],
        });
        break;
      default:
        break;
    }
  }, []);

  const handleChange = useCallback((condition: Condition) => {
    onConditionChange(condition);
  }, []);

  const shouldNotRenderSelect = filter.type === "boolean";
  const shouldNotRenderNextIcon = filter.type === "boolean";

  if (!filter.isOpen) return null;
  return (
    <>
      {!shouldNotRenderSelect && (
        <ConditionSelect
          type={filter.type}
          condition={filter.condition}
          onSelect={handleSelect}
        />
      )}
      <Flex
        as="label"
        htmlFor={filter.label}
        css={{
          marginTop: shouldNotRenderSelect ? "0" : "10px",
        }}>
        {!shouldNotRenderNextIcon && (
          <Flex css={{ marginTop: "8px" }}>
            <NextIcon />
          </Flex>
        )}
        <Box
          css={{
            marginLeft: shouldNotRenderNextIcon ? 0 : "11px",
            width: "100%",
          }}>
          <ConditionValue
            filter={filter}
            condition={filter.condition}
            onChange={handleChange}
          />
        </Box>
      </Flex>
    </>
  );
};

export default FieldContent;
