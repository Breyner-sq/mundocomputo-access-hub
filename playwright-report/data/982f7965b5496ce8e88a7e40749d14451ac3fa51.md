# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - button "Menú de accesibilidad" [ref=e3] [cursor=pointer]:
    - img
  - generic [ref=e5]:
    - generic [ref=e6]:
      - heading "MundoComputo" [level=3] [ref=e7]
      - paragraph [ref=e8]: Ingresa tus credenciales para acceder
    - generic [ref=e10]:
      - generic [ref=e11]:
        - text: Correo electrónico
        - textbox "Correo electrónico" [ref=e12]:
          - /placeholder: tu@email.com
      - generic [ref=e13]:
        - text: Contraseña
        - generic [ref=e14]:
          - textbox "Contraseña" [ref=e15]:
            - /placeholder: ••••••••
          - button [ref=e16] [cursor=pointer]:
            - img
      - button "Iniciar sesión" [ref=e17] [cursor=pointer]
```