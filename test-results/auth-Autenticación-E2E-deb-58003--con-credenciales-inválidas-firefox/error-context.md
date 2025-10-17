# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - region "Notifications (F8)":
      - list [ref=e4]:
        - status [ref=e5]:
          - generic [ref=e6]:
            - generic [ref=e7]: Error al iniciar sesión
            - generic [ref=e8]: Invalid login credentials
          - button [ref=e9] [cursor=pointer]:
            - img [ref=e10]
    - region "Notifications alt+T"
    - button "Menú de accesibilidad" [ref=e14] [cursor=pointer]:
      - img
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "MundoComputo" [level=3] [ref=e18]
        - paragraph [ref=e19]: Ingresa tus credenciales para acceder
      - generic [ref=e21]:
        - generic [ref=e22]:
          - text: Correo electrónico
          - textbox "Correo electrónico" [ref=e23]:
            - /placeholder: tu@email.com
            - text: invalido@test.com
        - generic [ref=e24]:
          - text: Contraseña
          - generic [ref=e25]:
            - textbox "Contraseña" [ref=e26]:
              - /placeholder: ••••••••
              - text: ContraseñaIncorrecta123
            - button [ref=e27] [cursor=pointer]:
              - img
        - button "Iniciar sesión" [ref=e28] [cursor=pointer]
  - status [ref=e29]: Notification Error al iniciar sesiónInvalid login credentials
```