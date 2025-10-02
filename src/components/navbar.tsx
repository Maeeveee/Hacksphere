import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "@/components/ui/menubar"

export default function Navbar() {
    return (
        <Menubar>

            {/* Jadwal Kereta */}
            <MenubarMenu>
                <MenubarTrigger>Jadwal Kereta</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Jawa</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Sumatra</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Kalimantan</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Papua</MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            {/* Beli Tiket */}
             <MenubarMenu>
                <MenubarTrigger>Promo</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Kemerdekaan</MenubarItem>
                    <MenubarItem>11.11</MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            {/* Akun */}
             <MenubarMenu>
                <MenubarTrigger>Akun</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Daftar</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Masuk</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}