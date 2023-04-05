import {
  Box,
  Button,
  Flex,
  DropdownMenuItem,
  Text,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Heading,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";

const Suspend = ({ stream, invalidate }) => {
  const { patchStream } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}>
        {!stream.suspended ? "Suspend stream" : "Unsuspend stream"}
      </DropdownMenuItem>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">
            {!stream.suspended ? "Suspend stream?" : "Unsuspend stream?"}
          </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text size="3" variant="gray" css={{ mt: "$2", lineHeight: "22px" }}>
            {!stream.suspended
              ? `Are you sure you want to suspend this stream? 
            Any active stream sessions will immediately end. 
            New sessions will be prevented from starting until unsuspended.`
              : `Are you sure you want to allow new stream sessions again?`}
          </Text>
        </AlertDialogDescription>
        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" onClick={() => setOpen(false)} ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              variant={stream.suspended ? "blue" : "red"}
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                try {
                  setSaving(true);
                  const suspended = !stream.suspended;
                  await patchStream(stream.id, { suspended });
                  await invalidate();
                } finally {
                  setSaving(false);
                  setOpen(false);
                }
              }}>
              {saving && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              {stream.suspended ? "Unsuspend" : "Suspend"}
            </Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Suspend;
