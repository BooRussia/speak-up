type Props = { size?: number }

export function IconArrow({ size = 16 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5 13 8l-5 5.5M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3.8c.3-.3.8-.4 1.2-.2l1.8.8c.4.2.7.6.6 1.1l-.4 1.9a1 1 0 0 1-.6.7l-1 .4a10 10 0 0 0 4.9 4.9l.4-1a1 1 0 0 1 .7-.6l1.9-.4c.5-.1.9.2 1.1.6l.8 1.8c.2.4.1.9-.2 1.2l-1.1 1.1c-.4.4-1 .6-1.6.5-5.2-1-9.3-5.1-10.3-10.3-.1-.6.1-1.2.5-1.6L7 3.8Z"
      />
    </svg>
  )
}

export function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.5 6.5h17v11h-17v-11Zm1.6 1.4 6.9 4.6 6.9-4.6H5.1Zm12.8 8.2V9.2l-5.9 3.9-5.9-3.9v6.9h11.8Z"
      />
    </svg>
  )
}

export function IconLearn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12.5H7.2A2.2 2.2 0 0 0 5 21.7V4.5Zm2 2V18.2c.4-.1.8-.2 1.2-.2H15V7a.5.5 0 0 0-.5-.5H7Z" />
    </svg>
  )
}

export function IconPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 12.2 6.2 12.2s6.2-7.6 6.2-12.2A6.2 6.2 0 0 0 12 2.8Zm0 8.4a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z" />
    </svg>
  )
}

export function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9.2 4.2 4 6.1v13.7l5.2-1.9 5.6 2.1 5.2-1.9V4.4l-5.2 1.9-5.6-2.1Zm.6 2.2v10.7l-3.6 1.3V7.7l3.6-1.3Zm1.8.6 3.8 1.4v10.7l-3.8-1.4V7Zm5.6 1.5 3.2-1.2v10.6l-3.2 1.2V8.5Z" />
    </svg>
  )
}

export function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M10.2 2.8h3.6l.4 2.2a7.2 7.2 0 0 1 1.8.8l2-1.1 2.5 2.5-1.1 2c.4.6.6 1.2.8 1.8l2.2.4v3.6l-2.2.4a7.2 7.2 0 0 1-.8 1.8l1.1 2-2.5 2.5-2-1.1a7.2 7.2 0 0 1-1.8.8l-.4 2.2h-3.6l-.4-2.2a7.2 7.2 0 0 1-1.8-.8l-2 1.1-2.5-2.5 1.1-2a7.2 7.2 0 0 1-.8-1.8l-2.2-.4V9.4l2.2-.4c.2-.6.4-1.2.8-1.8l-1.1-2L6 3.7l2 1.1c.6-.4 1.2-.6 1.8-.8l.4-2.2ZM12 9.1A2.9 2.9 0 1 0 12 15a2.9 2.9 0 0 0 0-5.8Z" />
    </svg>
  )
}

export function IconCopy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 7h11v13H8V7Zm-3 3h2v10h9v2H5V10Z" />
    </svg>
  )
}
