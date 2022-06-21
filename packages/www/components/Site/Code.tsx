import Highlight, { defaultProps } from "prism-react-renderer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@livepeer/design-system";

const Code = ({
  language,
  custom = true,
  value,
  children,
  className,
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  if (className && className.startsWith("language-")) {
    language = className.replace("language-", "");
  }

  const handleCopy = useCallback(() => {
    try {
      navigator.clipboard.writeText(children);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copied]);

  const theme = useMemo(() => {
    return {
      plain: {
        backgroundColor: custom ? "#3B375A" : "#9CDCFE",
        color: custom ? "#fff" : "#1E1E1E",
      },
      styles: [
        {
          types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
          style: {
            color: custom ? "#8782AC" : "rgb(0, 0, 128)",
          },
        },
        {
          types: ["namespace"],
          style: {
            opacity: 0.7,
          },
        },
        {
          types: ["tag", "operator", "number"],
          style: {
            color: custom ? "#C16AB9" : "rgb(181, 206, 168)",
          },
        },
        {
          types: ["property", "function"],
          style: {
            color: custom ? "#C4ED98" : "rgb(220, 220, 170)",
          },
        },
        {
          types: ["tag-id", "selector", "atrule-id"],
          style: {
            color: custom ? "#C4ED98" : "rgb(215, 186, 125)",
          },
        },
        {
          types: ["attr-name"],
          style: {
            color: custom ? "#C4ED98" : "rgb(156, 220, 254)",
          },
        },
        {
          types: [
            "boolean",
            "string",
            "entity",
            "url",
            "attr-value",
            "keyword",
            "control",
            "directive",
            "unit",
            "statement",
            "regex",
            "at-rule",
            "placeholder",
            "variable",
          ],
          style: {
            color: custom ? "#C4ED98" : "rgb(206, 145, 120)",
          },
        },
        {
          types: ["deleted"],
          style: {
            textDecorationLine: "line-through",
          },
        },
        {
          types: ["inserted"],
          style: {
            textDecorationLine: "underline",
          },
        },
        {
          types: ["italic"],
          style: {
            fontStyle: "italic",
          },
        },
        {
          types: ["important", "bold"],
          style: {
            fontWeight: "bold",
          },
        },
        {
          types: ["important"],
          style: {
            color: "#c4b9fe",
          },
        },
      ],
    };
  }, [custom]);

  return (
    <Highlight
      {...defaultProps}
      {...rest}
      code={value ?? children}
      language={language}
      // @ts-ignore
      theme={theme}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <Box
          as="pre"
          className="codeblock-pre-container"
          css={{
            bc: custom ? "#3B375A" : "",
            borderRadius: custom ? "16px" : "",
            width: "100%",
            maxWidth: "calc(100vw - 64px)",
            display: "flex",
            flexDirection: "column",
            marginBottom: custom ? "56px" : "",
            padding: custom ? "24px 16px 60px 24px" : "",
            position: "relative",
          }}>
          <Box css={{ maxWidth: "100%", overflowX: "auto" }}>
            {tokens.map((line, i) => {
              // Workaround for MDX rendering trailing lines on everything
              const lastLine = i === tokens.length - 1;
              return (
                <Box key={i} {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => {
                    if (lastLine && token.empty) {
                      return null;
                    }
                    return (
                      <span key={key} {...getTokenProps({ token, key })} />
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          {custom && (
            <Box
              as="button"
              onClick={handleCopy}
              css={{
                position: "absolute",
                alignSelf: "flex-end",
                bottom: "16px",
                right: "16px",
                bc: "$blue9",
                borderRadius: "6px",
                width: "60px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                cursor: "pointer",
                outline: "none",
                ":focus": {
                  outline: "none",
                },
              }}>
              {copied ? "Copied" : "Copy"}
            </Box>
          )}
        </Box>
      )}
    </Highlight>
  );
};

export default Code;
