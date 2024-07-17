import {
  TextField,
  Button,
  Grid,
  Box,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.studio/api/dist/hash";
import { useRouter } from "next/navigation";
import { useHubspotForm } from "hooks";
import Link from "next/link";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const Login = ({ id, buttonText, onSubmit, loading, errors }) => {
  const [password, setPassword] = useState("");

  const { handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_LOGIN_FORM_ID,
  });

  const submit = async (e) => {
    e.preventDefault();

    // only handle submission to hubspot on prod
    if (process.env.NEXT_PUBLIC_SITE_URL === "livepeer.studio") {
      handleSubmit(e);
    }

    const [hashedPassword] = await hash(password, FRONTEND_SALT);
    // hash password, then
    return onSubmit({
      password: hashedPassword,
    });
  };

  return (
    <Box
      css={{
        position: "relative",
        width: "100%",
      }}>
      <Text
        variant="neutral"
        size={5}
        css={{
          maxWidth: 460,
          textAlign: "center",
          mx: "auto",
          mb: "$7",
        }}>
        Reset your password.
      </Text>
      <Box
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 500,
        }}>
        <form id={id} onSubmit={submit}>
          <Text
            variant="neutral"
            size={1}
            css={{
              mb: "$1",
              fontSize: "11px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
            Password
          </Text>
          <Box css={{ position: "relative", width: "100%" }}>
            <TextField
              size="3"
              id="password"
              css={{
                width: "100%",
                mx: 0,
              }}
              name="password"
              type="password"
              placeholder="Choose new password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>

          {errors.length > 0 && (
            <Box css={{ mt: "$2" }}>{errors.join(", ")}&nbsp;</Box>
          )}

          <Button
            variant="transparentWhite"
            size={4}
            css={{
              bc: "#F8F8F8",
              color: "black",
              borderRadius: 10,
              fontWeight: 600,
              width: "100%",
              fontSize: 14,
              textDecoration: "none",
              textTransform: "uppercase",
              mt: "$3",
              "&:hover": {
                bc: "rgba(255, 255, 255, .8)",
                transition: ".2s",
                color: "black",
                textDecoration: "none",
              },
            }}>
            {loading ? "Loading..." : buttonText}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
