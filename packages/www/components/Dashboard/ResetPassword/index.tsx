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
import { useRouter } from "next/router";
import { useHubspotForm } from "hooks";
import Link from "next/link";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const Login = ({ id, buttonText, onSubmit, loading, errors }) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_LOGIN_FORM_ID,
  });

  const submit = async (e) => {
    e.preventDefault();
    handleSubmit(e);

    const [hashedPassword] = await hash(password, FRONTEND_SALT);
    // hash password, then
    onSubmit({
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
        as="form"
        onSubmit={submit}
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 450,
        }}
        id={id}>
        <Text
          variant="neutral"
          size={1}
          css={{
            mb: "$1",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
          Broadcasting provider
        </Text>
        <TextField
          readOnly
          size="3"
          id="email"
          css={{
            width: "100%",
            bc: "$neutral2",
            mb: "$4",
          }}
          name="broadcastingProvider"
          type="text"
          required
          value="Livepeer Inc (default)"
        />
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
            placeholder="Choose password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Box>

        {errors.length > 0 && (
          <Box css={{ mt: "$2" }}>{errors.join(", ")}&nbsp;</Box>
        )}

        <Button
          variant="primary"
          size={4}
          css={{
            width: "100%",
            mt: "$3",
            px: "$3",
            fontSize: "$3",
          }}>
          {loading ? "Loading..." : buttonText}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;