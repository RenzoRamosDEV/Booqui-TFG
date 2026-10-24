import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ComponentType, type ReactNode } from 'react'
import { Dialog } from './Dialog'
import { Drawer } from './Drawer'

type OverlayProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
}

function Harness({ Overlay }: { Overlay: ComponentType<OverlayProps> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Confirmar compra"
        description="Revisa los datos"
      >
        <button>Cancelar</button>
        <button>Confirmar</button>
      </Overlay>
    </>
  )
}

async function openOverlay(Overlay: ComponentType<OverlayProps>) {
  const user = userEvent.setup()
  render(<Harness Overlay={Overlay} />)
  const trigger = screen.getByRole('button', { name: 'Abrir' })
  await user.click(trigger)
  return { user, trigger, dialog: screen.getByRole('dialog') }
}

describe.each([
  ['Dialog', Dialog],
  ['Drawer', Drawer],
] as const)('%s', (_name, Overlay) => {
  it('renders nothing while closed', () => {
    render(<Harness Overlay={Overlay} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a labelled modal dialog portalled to the body', async () => {
    const { dialog } = await openOverlay(Overlay)

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Confirmar compra')
    expect(dialog).toHaveAccessibleDescription('Revisa los datos')
    expect(dialog.parentElement?.parentElement).toBe(document.body)
  })

  it('moves focus inside when opened', async () => {
    const { dialog } = await openOverlay(Overlay)

    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it('wraps Tab from the last element to the first', async () => {
    const { user, dialog } = await openOverlay(Overlay)
    const focusables = dialog.querySelectorAll<HTMLElement>('button')
    focusables[focusables.length - 1]!.focus()

    await user.tab()

    expect(focusables[0]).toHaveFocus()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const { user, trigger } = await openOverlay(Overlay)

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('closes from its close button', async () => {
    const { user } = await openOverlay(Overlay)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes when the backdrop is clicked', async () => {
    const { user } = await openOverlay(Overlay)

    await user.click(screen.getByTestId('overlay-backdrop'))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('locks body scroll while open and restores it after closing', async () => {
    document.body.style.overflow = 'auto'
    const { user } = await openOverlay(Overlay)

    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.body.style.overflow).toBe('auto'))
    document.body.style.overflow = ''
  })
})
