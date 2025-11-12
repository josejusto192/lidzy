"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Contact = {
  id: string
  nome_empresa: string
  email?: string | null
  telefone?: string | null
}

interface ContactSearchComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function ContactSearchCombobox({
  value,
  onValueChange,
  placeholder = "Selecione um contato...",
}: ContactSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/contatos")
      if (!response.ok) throw new Error("Erro ao buscar contatos")
      const data = await response.json()
      setContacts(data.contatos || [])
    } catch (error) {
      console.error("[v0] Erro ao buscar contatos:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedContact = contacts.find((contact) => contact.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {selectedContact ? (
            <span className="truncate">{selectedContact.nome_empresa}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar contato..." />
          <CommandList>
            <CommandEmpty>{loading ? "Carregando..." : "Nenhum contato encontrado."}</CommandEmpty>
            <CommandGroup>
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.nome_empresa}
                  onSelect={() => {
                    onValueChange(contact.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === contact.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium">{contact.nome_empresa}</span>
                    {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
