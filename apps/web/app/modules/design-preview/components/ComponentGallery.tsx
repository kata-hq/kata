import {
  Box,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  Dialog,
  DialogClose,
  Heading,
  Icon,
  Input,
  iconNames,
  Select,
  Stack,
  Text,
  TextArea,
  type TextSize,
  type TextWeight,
  type Tone,
} from "@kata/design-system";
import type { ReactNode } from "react";

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const tones: Tone[] = ["default", "muted", "accent", "danger", "success", "warning"];
const textSizes: TextSize[] = ["xs", "sm", "md", "lg", "xl"];
const textWeights: TextWeight[] = ["regular", "medium", "semibold", "bold"];
const options = [
  { value: "math", label: "Mathematics" },
  { value: "history", label: "History" },
  { value: "physics", label: "Physics", disabled: true },
];

/** A titled block of the preview. */
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Stack as="section" gap="md">
    <Heading level={3}>{title}</Heading>
    {children}
  </Stack>
);

/** Every design-system component with its variants. `idPrefix` keeps ids unique when shown twice. */
export const ComponentGallery = ({ idPrefix }: { idPrefix: string }) => (
  <Stack gap="xl">
    <Section title="Heading">
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>
    </Section>

    <Section title="Text">
      <Stack direction="row" gap="md" wrap align="baseline">
        {textSizes.map((size) => (
          <Text key={size} size={size}>
            size {size}
          </Text>
        ))}
      </Stack>
      <Stack direction="row" gap="md" wrap>
        {textWeights.map((weight) => (
          <Text key={weight} weight={weight}>
            {weight}
          </Text>
        ))}
      </Stack>
      <Stack direction="row" gap="md" wrap>
        {tones.map((tone) => (
          <Text key={tone} tone={tone}>
            {tone}
          </Text>
        ))}
      </Stack>
      <Text as="code">as code</Text>
    </Section>

    <Section title="Icon">
      <Stack direction="row" gap="md" wrap align="center">
        {iconNames.map((name) => (
          <Icon key={name} name={name} label={name} />
        ))}
        <Icon name="check" size="sm" tone="success" />
        <Icon name="check" size="md" tone="success" />
        <Icon name="check" size="lg" tone="success" />
      </Stack>
    </Section>

    <Section title="Button">
      <Stack direction="row" gap="sm" wrap>
        {buttonVariants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </Stack>
      <Stack direction="row" gap="sm" wrap align="center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </Stack>
    </Section>

    <Section title="Box and Stack">
      <Stack direction="row" gap="md" wrap>
        <Box padding="md" background="bg" radius="md" border>
          <Text>Box bg</Text>
        </Box>
        <Box padding="md" background="bgSubtle" radius="md" border>
          <Text>Box bgSubtle</Text>
        </Box>
        <Box padding="md" background="surface" radius="md" border>
          <Text>Box surface</Text>
        </Box>
      </Stack>
      <Stack direction="row" gap="sm" justify="between">
        <Text>Stack</Text>
        <Text>justify</Text>
        <Text>between</Text>
      </Stack>
    </Section>

    <Section title="Card">
      <Stack direction="row" gap="md" wrap>
        <Card variant="outlined">
          <Text>Outlined card</Text>
        </Card>
        <Card variant="elevated">
          <Text>Elevated card</Text>
        </Card>
      </Stack>
    </Section>

    <Section title="Input and TextArea">
      <Input id={`${idPrefix}-input`} label="Email" type="email" placeholder="you@example.com" />
      <Input
        id={`${idPrefix}-input-error`}
        label="Name"
        description="As on your student card."
        error="Name is required."
      />
      <Input id={`${idPrefix}-input-disabled`} label="Disabled" disabled defaultValue="Read only" />
      <TextArea id={`${idPrefix}-textarea`} label="Notes" rows={3} placeholder="Write something" />
    </Section>

    <Section title="Checkbox">
      <Checkbox id={`${idPrefix}-checkbox`} label="Remember me" />
      <Checkbox
        id={`${idPrefix}-checkbox-checked`}
        label="Checked"
        description="With a description."
        defaultChecked
      />
      <Checkbox id={`${idPrefix}-checkbox-disabled`} label="Disabled" disabled />
    </Section>

    <Section title="Select">
      <Select id={`${idPrefix}-select`} label="Subject" placeholder="Choose a subject" options={options} />
      <Select id={`${idPrefix}-select-error`} label="With error" options={options} error="Pick one." />
    </Section>

    <Section title="Dialog">
      <Stack direction="row">
        <Dialog
          title="Delete note"
          description="This cannot be undone."
          trigger={<Button variant="danger">Open dialog</Button>}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <DialogClose variant="danger">Delete</DialogClose>
            </>
          }
        >
          <Text>Dialog content.</Text>
        </Dialog>
      </Stack>
    </Section>
  </Stack>
);
