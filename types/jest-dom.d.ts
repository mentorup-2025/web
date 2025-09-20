import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveStyle(css: string | Record<string, any>): R
      toBeVisible(): R
      toBeEmptyDOMElement(): R
      toBeInvalid(): R
      toBeRequired(): R
      toBeValid(): R
      toContainElement(element: HTMLElement | SVGElement | null): R
      toContainHTML(htmlText: string): R
      toHaveAccessibleDescription(expectedAccessibleDescription?: string | RegExp): R
      toHaveAccessibleErrorMessage(expectedAccessibleErrorMessage?: string | RegExp): R
      toHaveAccessibleName(expectedAccessibleName?: string | RegExp): R
      toHaveAttribute(attr: string, value?: string | RegExp): R
      toHaveClass(...classNames: string[]): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value?: string | string[] | number): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDescription(text?: string | RegExp): R
      toHaveErrorMessage(text?: string | RegExp): R
    }
  }
}
