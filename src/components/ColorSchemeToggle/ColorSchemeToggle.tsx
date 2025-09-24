import { Group, Select, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const handleColorSchemeChange = (value: string | null) => {
    if (value) {
      setColorScheme(value as 'light' | 'dark' | 'auto');
    }
  };

  return (
    <Group justify="center" mt="xl">
      <Select
        label="Website Color Settings"
        data={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ]}
        value={colorScheme}
        onChange={handleColorSchemeChange}
        placeholder="Select color scheme"
        allowDeselect={false}
        w={280}
      />
    </Group>
  );
}
