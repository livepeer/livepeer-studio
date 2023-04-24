import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  TextField,
  Text,
  Heading,
  Label,
  Link,
  Tooltip,
  Checkbox,
  styled,
} from "@livepeer/design-system";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import { ApiToken } from "@livepeer.studio/api";
import {
  ExclamationTriangleIcon as Warning,
  QuestionMarkCircledIcon as Help,
  Cross1Icon as Cross,
  PlusIcon as Plus,
} from "@radix-ui/react-icons";
import ClipButton from "../Clipping/ClipButton";

const initialCorsOpts: ApiToken["access"]["cors"] = {
  allowedOrigins: ["http://localhost:3000"],
};

const StyledCross = styled(Cross, {});

const CreateDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
}) => {
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [allowCors, setAllowCors] = useState(false);
  const [cors, setCors] = useState(initialCorsOpts);
  const [newAllowedOrigin, setNewAllowedOrigin] = useState("");
  const { createApiToken, user } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);

  const isAdmin = useMemo(() => user?.admin === true, [user]);
  useEffect(() => {
    setNewToken(null);
    setTokenName("");
    setAllowCors(false);
    setCors(initialCorsOpts);
    setNewAllowedOrigin("");
  }, [isOpen]);

  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);

  const toggleOrigin = useCallback(
    (origin) => {
      setCors((cors) => {
        let allowedOrigins = cors.allowedOrigins?.includes(origin)
          ? cors.allowedOrigins.filter((item) => item !== origin)
          : [...cors.allowedOrigins, origin];
        if (allowedOrigins.includes("*")) {
          allowedOrigins = ["*"];
        }
        return {
          ...cors,
          allowedOrigins,
        };
      });
    },
    [setCors]
  );

  const isNewOriginValid = useMemo(() => {
    if (newAllowedOrigin === "*") {
      return true;
    }
    try {
      const url = new URL(newAllowedOrigin);
      return url.origin === newAllowedOrigin;
    } catch (err) {
      return false;
    }
  }, [newAllowedOrigin]);

  const onSubmitNewOrigin = useCallback(() => {
    if (!isNewOriginValid) {
      return;
    }
    setNewAllowedOrigin((value) => {
      if (value !== "") {
        toggleOrigin(value);
      }
      return "";
    });
  }, [toggleOrigin, setNewAllowedOrigin, isNewOriginValid]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newToken && (
          <>
            <AlertDialogTitle asChild>
              <Heading size="1">Create an API Key</Heading>
            </AlertDialogTitle>
            <Box
              as="form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (creating) {
                  return;
                }
                setCreating(true);
                try {
                  const _newToken = await createApiToken({
                    name: tokenName,
                    access: allowCors ? { cors } : undefined,
                  });
                  setNewToken(_newToken);
                  onCreateSuccess?.();
                } finally {
                  setCreating(false);
                }
              }}>
              <AlertDialogDescription asChild>
                <Text
                  size="3"
                  variant="neutral"
                  css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                  Enter a name for your key to differentiate it from other keys.
                </Text>
              </AlertDialogDescription>

              <Flex direction="column" gap="2">
                <TextField
                  size="2"
                  type="text"
                  required
                  id="tokenName"
                  autoFocus={true}
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. New key"
                />

                <Box css={{ display: "flex", mt: "$2", alignItems: "center" }}>
                  <Checkbox
                    id="allowCors"
                    checked={allowCors}
                    disabled={isAdmin}
                    onCheckedChange={(checked: boolean) =>
                      setAllowCors(checked)
                    }
                  />
                  <Tooltip
                    content={
                      isAdmin
                        ? "CORS API keys are not available to admins."
                        : "This will allow the API key to be used directly from the browser. It is recommended only for development purposes since including your API key in web pages will expose it to the world."
                    }
                    multiline>
                    <Flex
                      direction="row"
                      css={{ ml: "$2" }}
                      gap="1"
                      align="center">
                      <Label htmlFor="allowCors">Allow CORS access</Label>
                      <Link
                        href="https://docs.livepeer.studio/quickstart/#create-api-key"
                        target="_blank">
                        <Warning />
                      </Link>
                    </Flex>
                  </Tooltip>
                </Box>

                {allowCors && (
                  <>
                    <Label htmlFor="addAllowedOrigin" css={{ mt: "$1" }}>
                      Add an origin
                    </Label>
                    <Box css={{ display: "flex", alignItems: "stretch" }}>
                      <TextField
                        size="2"
                        type="text"
                        id="addAllowedOrigin"
                        value={newAllowedOrigin}
                        state={
                          newAllowedOrigin !== "" && !isNewOriginValid
                            ? "invalid"
                            : null
                        }
                        onChange={(e) => setNewAllowedOrigin(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSubmitNewOrigin();
                          }
                        }}
                        placeholder="e.g. * for all origins; https://example.com for one"
                      />
                      <Button
                        css={{ ml: "$1" }}
                        size="3"
                        variant="primary"
                        disabled={!isNewOriginValid}
                        onClick={(e) => {
                          e.preventDefault();
                          onSubmitNewOrigin();
                        }}>
                        <Plus />
                      </Button>
                    </Box>

                    <Flex
                      align="center"
                      direction="column"
                      justify={
                        cors.allowedOrigins.length > 0 ? "start" : "center"
                      }
                      css={{
                        width: "100%",
                        borderRadius: 6,
                        height: 120,
                        overflowX: "hidden",
                        overflowY: "auto",
                        border: "1px solid $colors$neutral7",
                        backgroundColor: "$neutral2",
                        mt: "-3px",
                        zIndex: 1,
                      }}>
                      {cors.allowedOrigins.length > 0 ? (
                        cors.allowedOrigins.map((origin, i) => (
                          <Flex
                            key={i}
                            justify="between"
                            align="center"
                            css={{
                              width: "100%",
                              borderBottom: "1px solid $colors$neutral5",
                              p: "$2",
                              fontSize: "$2",
                              color: "$hiContrast",
                            }}>
                            {origin}
                            <StyledCross
                              onClick={() => {
                                toggleOrigin(origin);
                              }}
                            />
                          </Flex>
                        ))
                      ) : (
                        <Flex
                          direction="column"
                          css={{ just: "center" }}
                          align="center">
                          <Text css={{ fontWeight: 600 }}>
                            No origins allowed
                          </Text>
                          <Text variant="neutral">
                            Add origins with the input field above.
                          </Text>
                        </Flex>
                      )}
                    </Flex>

                    <Box css={{ display: "flex", mt: "$2" }}>
                      <Checkbox
                        id="corsFullAccess"
                        checked={cors.fullAccess ?? false}
                        onCheckedChange={(checked: boolean) =>
                          setCors({
                            ...cors,
                            fullAccess: checked,
                          })
                        }
                      />
                      <Tooltip
                        content="This will give access to the entire API for the CORS-enabled API key. Resources in your account will be fully exposed to anyone that grabs the API key from your web page. Only check this if you know what you are doing."
                        multiline>
                        <Flex
                          direction="row"
                          css={{ ml: "$2" }}
                          gap="1"
                          align="center">
                          <Label htmlFor="corsFullAccess">
                            Full API access (not recommended)
                          </Label>
                          <Link
                            href={
                              "/docs/guides/start-live-streaming/api-key#api-access"
                            }
                            target="_blank">
                            <Help />
                          </Link>
                        </Flex>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Flex>

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <AlertDialogCancel asChild>
                  <Button size="2" ghost>
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <Button
                  size="2"
                  disabled={creating}
                  type="submit"
                  variant="primary">
                  {creating && (
                    <Spinner
                      css={{
                        color: "$hiContrast",
                        width: 16,
                        height: 16,
                        mr: "$2",
                      }}
                    />
                  )}
                  Create
                </Button>
              </Flex>
            </Box>
          </>
        )}
        {newToken && (
          <Box>
            <AlertDialogTitle asChild>
              <Heading size="1">Token Created</Heading>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="neutral"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                <Box>
                  <Box css={{ mb: "$2" }}>Here's your new API key:</Box>
                  <Button variant="neutral" size="2">
                    <ClipButton value={newToken.id} text={newToken.id} />
                  </Button>
                </Box>
              </Text>
            </AlertDialogDescription>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button onClick={() => onClose()} size="2">
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateDialog;
