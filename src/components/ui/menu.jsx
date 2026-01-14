// src/components/ui/menu.jsx
// Chakra UI v3 Menu wrapper components
import { Menu as ChakraMenu } from "@chakra-ui/react"
import * as React from "react"

export const MenuRoot = React.forwardRef(
  function MenuRoot(props, ref) {
    return <ChakraMenu.Root {...props} ref={ref} />
  },
)

export const MenuTrigger = ChakraMenu.Trigger
export const MenuPositioner = ChakraMenu.Positioner
export const MenuContent = ChakraMenu.Content
export const MenuItem = ChakraMenu.Item
export const MenuSeparator = ChakraMenu.Separator
export const MenuItemGroup = ChakraMenu.ItemGroup
export const MenuItemGroupLabel = ChakraMenu.ItemGroupLabel
export const MenuCheckboxItem = ChakraMenu.CheckboxItem
export const MenuRadioItem = ChakraMenu.RadioItem
export const MenuRadioItemGroup = ChakraMenu.RadioItemGroup
export const MenuItemIndicator = ChakraMenu.ItemIndicator
export const MenuArrow = ChakraMenu.Arrow
