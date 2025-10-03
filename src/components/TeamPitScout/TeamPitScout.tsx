import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import {
  type PitScout,
  type PitScoutIdentifier,
  type PitScout2025,
  type PitScoutUpsertPayload,
  useCreatePitScoutRecord,
  useDeletePitScoutRecord,
  usePitScoutRecords,
  useUpdatePitScoutRecord,
} from '@/api';

interface TeamPitScoutProps {
  teamNumber: number;
}

type PitScoutFormValues = PitScout2025;

type NumberField =
  | 'robot_weight'
  | 'autoCoralCount'
  | 'autoAlgaeNet'
  | 'autoAlgaeProcessor';

type BooleanField =
  | 'startPositionLeft'
  | 'startPositionCenter'
  | 'startPositionRight'
  | 'pickupGround'
  | 'pickupFeeder'
  | 'autoL4Coral'
  | 'autoL3Coral'
  | 'autoL2Coral'
  | 'autoL1Coral'
  | 'teleL4Coral'
  | 'teleL3Coral'
  | 'teleL2Coral'
  | 'teleL1Coral'
  | 'teleAlgaeNet'
  | 'teleAlgaeProcessor';

type TextField =
  | 'notes'
  | 'drivetrain'
  | 'driveteam'
  | 'autoNotes'
  | 'teleNotes'
  | 'overallNotes';

const ENDGAME_OPTIONS: PitScout['endgame'][] = ['NONE', 'PARK', 'SHALLOW', 'DEEP'];
const NULLABLE_NUMBER_FIELDS: NumberField[] = ['robot_weight', 'autoCoralCount'];

const DRIVETRAIN_OPTIONS = [
  { value: 'SWERVE', label: 'SWERVE' },
  { value: 'TANK', label: 'TANK' },
  { value: 'MECANUM', label: 'MECANUM' },
  { value: 'H-DRIVE', label: 'H-DRIVE' },
  { value: 'OTHER', label: 'OTHER' },
] as const;

const getEmptyFormValues = (teamNumber: number): PitScoutFormValues => ({
  season: 5,
  team_number: teamNumber,
  event_key: '',
  user_id: '',
  organization_id: null,
  timestamp: '',
  notes: '',
  robot_weight: null,
  drivetrain: '',
  driveteam: '',
  startPositionLeft: false,
  startPositionCenter: false,
  startPositionRight: false,
  pickupGround: false,
  pickupFeeder: false,
  autoL4Coral: false,
  autoL3Coral: false,
  autoL2Coral: false,
  autoL1Coral: false,
  autoCoralCount: null,
  autoAlgaeNet: 0,
  autoAlgaeProcessor: 0,
  autoNotes: '',
  teleL4Coral: false,
  teleL3Coral: false,
  teleL2Coral: false,
  teleL1Coral: false,
  teleAlgaeNet: false,
  teleAlgaeProcessor: false,
  teleNotes: '',
  endgame: 'NONE',
  overallNotes: '',
});

const normalizeRecord = (record: PitScout | undefined, teamNumber: number): PitScoutFormValues => {
  const base = getEmptyFormValues(teamNumber);

  if (!record) {
    return base;
  }

  return {
    ...base,
    ...record,
    notes: record.notes ?? '',
    drivetrain: record.drivetrain ?? '',
    driveteam: record.driveteam ?? '',
    autoNotes: record.autoNotes ?? '',
    teleNotes: record.teleNotes ?? '',
    overallNotes: record.overallNotes ?? '',
    user_id: record.user_id ?? '',
    organization_id: record.organization_id ?? null,
    robot_weight: record.robot_weight ?? null,
    autoCoralCount: record.autoCoralCount ?? null,
    autoAlgaeNet: record.autoAlgaeNet ?? 0,
    autoAlgaeProcessor: record.autoAlgaeProcessor ?? 0,
  } satisfies PitScoutFormValues;
};

const parseNumberInput = (value: string | number, allowNull: boolean) => {
  if (value === '' || value === null) {
    return allowNull ? null : 0;
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return allowNull ? null : 0;
  }

  return numericValue;
};

const getErrorMessage = (error: unknown) => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

export function TeamPitScout({ teamNumber }: TeamPitScoutProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<PitScoutFormValues>(() => getEmptyFormValues(teamNumber));
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const {
    data: pitScoutRecords = [],
    isLoading,
    isError,
    refetch,
  } = usePitScoutRecords(teamNumber);

  const existingRecord = useMemo(() => pitScoutRecords[0], [pitScoutRecords]);

  const createPitScout = useCreatePitScoutRecord(teamNumber);
  const updatePitScout = useUpdatePitScoutRecord(teamNumber);
  const deletePitScout = useDeletePitScoutRecord(teamNumber);

  useEffect(() => {
    if (!isEditing) {
      setFormValues(normalizeRecord(existingRecord, teamNumber));
    }
  }, [existingRecord, isEditing, teamNumber]);

  useEffect(() => {
    if (!existingRecord) {
      setIsConfirmingDelete(false);
    }
  }, [existingRecord]);

  useEffect(() => {
    setFormValues((current) => ({
      ...getEmptyFormValues(teamNumber),
      ...current,
      team_number: teamNumber,
    }));
  }, [teamNumber]);

  const handleNumberChange = (field: NumberField) => (value: string | number) => {
    const allowNull = NULLABLE_NUMBER_FIELDS.includes(field);
    const parsed = parseNumberInput(value, allowNull);

    setFormValues((prev) => ({
      ...prev,
      [field]: parsed,
    }));
  };

  const handleBooleanChange = (field: BooleanField) => (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setFormValues((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleTextChange = (field: TextField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.currentTarget;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDrivetrainChange = (value: string | null) => {
    setFormValues((prev) => ({
      ...prev,
      drivetrain: value ?? '',
    }));
  };

  const drivetrainOptions = useMemo(() => {
    if (!formValues.drivetrain) {
      return DRIVETRAIN_OPTIONS;
    }

    const hasExistingOption = DRIVETRAIN_OPTIONS.some(
      (option) => option.value === formValues.drivetrain,
    );

    if (hasExistingOption) {
      return DRIVETRAIN_OPTIONS;
    }

    return [
      ...DRIVETRAIN_OPTIONS,
      { value: formValues.drivetrain, label: formValues.drivetrain },
    ];
  }, [formValues.drivetrain]);

  const handleEndgameChange = (value: string | null) => {
    setFormValues((prev) => ({
      ...prev,
      endgame: (value as PitScout['endgame'] | null) ?? 'NONE',
    }));
  };

  const mutationError = createPitScout.error ?? updatePitScout.error ?? deletePitScout.error;
  const errorMessage = getErrorMessage(mutationError);

  const isSubmitting = createPitScout.isPending || updatePitScout.isPending;
  const isDeleting = deletePitScout.isPending;

  const handlePrimaryAction = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setIsConfirmingDelete(false);
      return;
    }

    const payload: PitScoutUpsertPayload = {
      team_number: formValues.team_number,
      notes: formValues.notes ?? '',
      robot_weight: formValues.robot_weight ?? null,
      drivetrain: formValues.drivetrain ?? '',
      driveteam: formValues.driveteam ?? '',
      startPositionLeft: formValues.startPositionLeft,
      startPositionCenter: formValues.startPositionCenter,
      startPositionRight: formValues.startPositionRight,
      pickupGround: formValues.pickupGround,
      pickupFeeder: formValues.pickupFeeder,
      autoL4Coral: formValues.autoL4Coral,
      autoL3Coral: formValues.autoL3Coral,
      autoL2Coral: formValues.autoL2Coral,
      autoL1Coral: formValues.autoL1Coral,
      autoCoralCount: formValues.autoCoralCount ?? null,
      autoAlgaeNet: formValues.autoAlgaeNet ?? 0,
      autoAlgaeProcessor: formValues.autoAlgaeProcessor ?? 0,
      autoNotes: formValues.autoNotes ?? '',
      teleL4Coral: formValues.teleL4Coral,
      teleL3Coral: formValues.teleL3Coral,
      teleL2Coral: formValues.teleL2Coral,
      teleL1Coral: formValues.teleL1Coral,
      teleAlgaeNet: formValues.teleAlgaeNet,
      teleAlgaeProcessor: formValues.teleAlgaeProcessor,
      teleNotes: formValues.teleNotes ?? '',
      endgame: formValues.endgame,
      overallNotes: formValues.overallNotes ?? '',
    };

    try {
      if (existingRecord) {
        await updatePitScout.mutateAsync(payload);
      } else {
        await createPitScout.mutateAsync(payload);
      }

      await refetch();
      setIsEditing(false);
      setIsConfirmingDelete(false);
    } catch (error) {
      // Errors are handled via mutation state.
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) {
      return;
    }

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    const identifier: PitScoutIdentifier = {
      season: existingRecord.season,
      event_key: existingRecord.event_key,
      team_number: existingRecord.team_number,
    };

    try {
      await deletePitScout.mutateAsync(identifier);
      await refetch();
      setFormValues(getEmptyFormValues(teamNumber));
      setIsEditing(false);
      setIsConfirmingDelete(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  if (!Number.isFinite(teamNumber)) {
    return (
      <Alert color="red" title="Invalid team number">
        Unable to display pit scouting information because the team number is invalid.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Stack align="center" mih={200} justify="center">
        <Loader />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load pit scouting information">
        Please try again later.
      </Alert>
    );
  }

  return (
    <Stack>
      <Title order={3}>Pit Scouting</Title>
      {errorMessage ? (
        <Alert color="red" title="Pit scouting error">
          {errorMessage}
        </Alert>
      ) : null}
      <Box>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label="Robot Weight"
              value={formValues.robot_weight ?? undefined}
              onChange={handleNumberChange('robot_weight')}
              disabled={!isEditing}
              min={0}
              placeholder="Enter robot weight"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Drivetrain"
              data={drivetrainOptions}
              value={formValues.drivetrain ? formValues.drivetrain : null}
              onChange={handleDrivetrainChange}
              disabled={!isEditing}
              placeholder="Select drivetrain"
              allowDeselect
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Drive Team"
              value={formValues.driveteam ?? ''}
              onChange={handleTextChange('driveteam')}
              disabled={!isEditing}
              placeholder="Enter drive team names"
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Notes"
              value={formValues.notes ?? ''}
              onChange={handleTextChange('notes')}
              disabled={!isEditing}
              minRows={2}
              placeholder="General notes"
            />
          </Grid.Col>
        </Grid>
      </Box>
      <Box>
        <Title order={4}>Starting Positions</Title>
        <Group gap="md">
          <Checkbox
            label="Left"
            checked={formValues.startPositionLeft}
            onChange={handleBooleanChange('startPositionLeft')}
            disabled={!isEditing}
          />
          <Checkbox
            label="Center"
            checked={formValues.startPositionCenter}
            onChange={handleBooleanChange('startPositionCenter')}
            disabled={!isEditing}
          />
          <Checkbox
            label="Right"
            checked={formValues.startPositionRight}
            onChange={handleBooleanChange('startPositionRight')}
            disabled={!isEditing}
          />
        </Group>
      </Box>
      <Box>
        <Title order={4}>Pickup Options</Title>
        <Group gap="md">
          <Checkbox
            label="Ground"
            checked={formValues.pickupGround}
            onChange={handleBooleanChange('pickupGround')}
            disabled={!isEditing}
          />
          <Checkbox
            label="Feeder"
            checked={formValues.pickupFeeder}
            onChange={handleBooleanChange('pickupFeeder')}
            disabled={!isEditing}
          />
        </Group>
      </Box>
      <Box>
        <Title order={4}>Autonomous Performance</Title>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L4 Coral"
              checked={formValues.autoL4Coral}
              onChange={handleBooleanChange('autoL4Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L3 Coral"
              checked={formValues.autoL3Coral}
              onChange={handleBooleanChange('autoL3Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L2 Coral"
              checked={formValues.autoL2Coral}
              onChange={handleBooleanChange('autoL2Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L1 Coral"
              checked={formValues.autoL1Coral}
              onChange={handleBooleanChange('autoL1Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Coral Count"
              value={formValues.autoCoralCount ?? undefined}
              onChange={handleNumberChange('autoCoralCount')}
              disabled={!isEditing}
              min={0}
              placeholder="0"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Algae - Net"
              value={formValues.autoAlgaeNet ?? undefined}
              onChange={handleNumberChange('autoAlgaeNet')}
              disabled={!isEditing}
              min={0}
              placeholder="0"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Algae - Processor"
              value={formValues.autoAlgaeProcessor ?? undefined}
              onChange={handleNumberChange('autoAlgaeProcessor')}
              disabled={!isEditing}
              min={0}
              placeholder="0"
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Autonomous Notes"
              value={formValues.autoNotes ?? ''}
              onChange={handleTextChange('autoNotes')}
              disabled={!isEditing}
              minRows={2}
              placeholder="Describe autonomous performance"
            />
          </Grid.Col>
        </Grid>
      </Box>
      <Box>
        <Title order={4}>Teleop Performance</Title>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L4 Coral"
              checked={formValues.teleL4Coral}
              onChange={handleBooleanChange('teleL4Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L3 Coral"
              checked={formValues.teleL3Coral}
              onChange={handleBooleanChange('teleL3Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L2 Coral"
              checked={formValues.teleL2Coral}
              onChange={handleBooleanChange('teleL2Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Checkbox
              label="L1 Coral"
              checked={formValues.teleL1Coral}
              onChange={handleBooleanChange('teleL1Coral')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Checkbox
              label="Algae - Net"
              checked={formValues.teleAlgaeNet}
              onChange={handleBooleanChange('teleAlgaeNet')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Checkbox
              label="Algae - Processor"
              checked={formValues.teleAlgaeProcessor}
              onChange={handleBooleanChange('teleAlgaeProcessor')}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Teleop Notes"
              value={formValues.teleNotes ?? ''}
              onChange={handleTextChange('teleNotes')}
              disabled={!isEditing}
              minRows={2}
              placeholder="Describe teleop performance"
            />
          </Grid.Col>
        </Grid>
      </Box>
      <Box>
        <Title order={4}>Endgame & Overall Notes</Title>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Endgame"
              value={formValues.endgame}
              data={ENDGAME_OPTIONS.map((option) => ({ value: option, label: option }))}
              onChange={handleEndgameChange}
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Overall Notes"
              value={formValues.overallNotes ?? ''}
              onChange={handleTextChange('overallNotes')}
              disabled={!isEditing}
              minRows={2}
              placeholder="Summarize the robot"
            />
          </Grid.Col>
        </Grid>
      </Box>
      <Group justify="flex-end">
        {isConfirmingDelete ? (
          <Button onClick={handleCancelDelete} disabled={isDeleting || isSubmitting} variant="subtle">
            Cancel
          </Button>
        ) : null}
        <Button
          color="red"
          onClick={handleDelete}
          disabled={!existingRecord || isDeleting || isSubmitting}
          loading={isDeleting}
          variant={isConfirmingDelete ? 'filled' : 'outline'}
        >
          {isConfirmingDelete ? 'Confirm delete' : 'Delete pit scout record'}
        </Button>
        <Button onClick={handlePrimaryAction} disabled={isDeleting || isSubmitting} loading={isSubmitting}>
          {isEditing ? 'Save changes' : 'Edit information'}
        </Button>
      </Group>
    </Stack>
  );
}
