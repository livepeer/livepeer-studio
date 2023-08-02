import { useCallback, useMemo, useState } from "react";
import { DotsHorizontalIcon as Overflow } from "@radix-ui/react-icons";

import {
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Heading,
  Text,
  Switch,
  useSnackbar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@livepeer/design-system";

import Spinner from "components/Spinner";

import { useApi } from "../../../hooks";
import { useToggleState } from "hooks/use-toggle-state";
import { MultistreamTarget, Stream } from "@livepeer.studio/api";
import SaveTargetDialog, { Action } from "./SaveTargetDialog";
import ErrorDialog from "../../ErrorDialog";

const DisableDialog = ({
  onDialogAction,
  open,
  setOpen,
}: {
  onDialogAction: () => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [saving, setSaving] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Disable multistream target?</Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            Changes will take effect when the next stream session is started.
          </Text>
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" disabled={saving} ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                setSaving(true);
                await onDialogAction();
                setSaving(false);
                setOpen(false);
              }}
              variant="red">
              {saving && (
                <Spinner
                  css={{
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Disable target
            </Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteDialog = ({
  target,
  stream,
  invalidateStream,
  open,
  setOpen,
}: {
  target?: MultistreamTarget;
  stream: Stream;
  invalidateStream: (optm: Stream) => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { patchStream, deleteMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Delete multistream target?</Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            Deleting a target cannot be undone. Any active sessions will
            continue to be multistreamed to this destination.
          </Text>
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                setSaving(true);
                try {
                  const targets = stream.multistream.targets.filter(
                    (t) => t.id !== target.id
                  );
                  const patch = { multistream: { targets } };
                  await patchStream(stream.id, patch);
                  await deleteMultistreamTarget(target.id);
                  setOpen(false);
                  await invalidateStream({ ...stream, ...patch });
                } finally {
                  setSaving(false);
                }
              }}
              variant="red">
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
              Delete
            </Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const Toolbox = ({
  target,
  stream,
  invalidateTargetId,
  invalidateStream,
}: {
  target?: MultistreamTarget;
  stream: Stream;
  invalidateTargetId: (id: string) => Promise<void>;
  invalidateStream: (optm?: Stream) => Promise<void>;
}) => {
  const { patchMultistreamTarget } = useApi();
  const errorRecordDialogState = useToggleState();
  const [openSnackbar] = useSnackbar();

  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const setTargetDisabled = useCallback(
    async (disabled: boolean) => {
      await patchMultistreamTarget(target.id, { disabled });
      await invalidateTargetId(target?.id);
      openSnackbar(
        `Target ${target.name} has been turned ${disabled ? "off" : "on"}.`
      );
    },
    [
      patchMultistreamTarget,
      invalidateTargetId,
      openSnackbar,
      target?.id,
      target?.name,
      target?.disabled,
    ]
  );
  const invalidateAll = useCallback(async () => {
    await Promise.all([invalidateStream(), invalidateTargetId(target?.id)]);
  }, [invalidateStream, invalidateTargetId, target?.id]);
  const targetRef = useMemo(() => {
    return stream?.multistream?.targets?.find((t) => t.id == target?.id);
  }, [stream?.multistream?.targets, target?.id]);

  return (
    <Flex align="center" gap="2" justify="end">
      <Switch
        name="multistream-target-toggle"
        disabled={!target}
        checked={!target?.disabled}
        value={`${!target?.disabled}`}
        onCheckedChange={useCallback(async () => {
          if (stream.isActive) {
            errorRecordDialogState.onOn();
          } else if (target?.disabled) {
            await setTargetDisabled(false);
          } else {
            setDisableDialogOpen(true);
          }
        }, [target?.disabled, setTargetDisabled])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ghost
            size="1"
            css={{
              display: "flex",
              ai: "center",
              "&:hover": { boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.5)" },
            }}>
            <Overflow />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={!target}
              onSelect={() =>
                stream.isActive
                  ? errorRecordDialogState.onOn()
                  : setSaveDialogOpen(true)
              }>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!target}
              onSelect={() =>
                stream.isActive
                  ? errorRecordDialogState.onOn()
                  : setDeleteDialogOpen(true)
              }
              color="red">
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ErrorDialog
        isOpen={errorRecordDialogState.on}
        onOpenChange={errorRecordDialogState.onToggle}
        description="You cannot change multistream preferences while a session is active"
      />

      <DisableDialog
        onDialogAction={useCallback(
          () => setTargetDisabled(true),
          [setTargetDisabled]
        )}
        open={disableDialogOpen}
        setOpen={setDisableDialogOpen}
      />
      <SaveTargetDialog
        action={Action.Update}
        isOpen={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        stream={stream}
        target={target}
        targetRef={targetRef}
        invalidate={invalidateAll}
      />
      <DeleteDialog
        target={target}
        stream={stream}
        invalidateStream={invalidateStream}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
    </Flex>
  );
};

export default Toolbox;
