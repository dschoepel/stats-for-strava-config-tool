import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react";
import * as React from "react";
import PropTypes from 'prop-types';

export const Tooltip = React.forwardRef(function Tooltip(props, ref) {
  const {
    showArrow,
    children,
    disabled,
    portalled = true,
    content,
    contentProps,
    portalRef,
    ...rest
  } = props;

  if (disabled) return children;

  return (
    <ChakraTooltip.Root {...rest}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            ref={ref}
            bg="gray.800"
            color="white"
            _light={{ bg: "gray.800", color: "white" }}
            _dark={{ bg: "gray.700", color: "white" }}
            {...contentProps}
          >
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});

Tooltip.propTypes = {
  showArrow: PropTypes.bool,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  portalled: PropTypes.bool,
  content: PropTypes.node.isRequired,
  contentProps: PropTypes.object,
  portalRef: PropTypes.object
};
