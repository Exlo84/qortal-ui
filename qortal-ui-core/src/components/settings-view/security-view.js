import { LitElement, html, css } from 'lit'
import { connect } from 'pwa-helpers'
import { store } from '../../store.js'
import { allowQAPPAutoAuth, removeQAPPAutoAuth, removeQAPPAutoLists, allowQAPPAutoLists } from '../../redux/app/app-actions.js'
import { use, get, translate, translateUnsafeHTML, registerTranslateConfig } from 'lit-translate'

import '@material/mwc-checkbox'
import '@material/mwc-textfield'
import '@material/mwc-icon'
import '@vaadin/password-field/vaadin-password-field.js'
import FileSaver from 'file-saver'

class SecurityView extends connect(store)(LitElement) {
    static get properties() {
        return {
            theme: { type: String, reflect: true },
            backupErrorMessage: { type: String }
        }
    }

    static get styles() {
        return css`
            * {
                --lumo-primary-text-color: rgb(0, 167, 245);
                --lumo-primary-color-50pct: rgba(0, 167, 245, 0.5);
                --lumo-primary-color-10pct: rgba(0, 167, 245, 0.1);
                --lumo-primary-color: hsl(199, 100%, 48%);
                --lumo-base-color: var(--white);
                --lumo-body-text-color: var(--black);
                --lumo-secondary-text-color: var(--sectxt);
                --lumo-contrast-60pct: var(--vdicon);
                --mdc-checkbox-unchecked-color: var(--black);
                --mdc-theme-on-surface: var(--black);
                --mdc-checkbox-disabled-color: var(--black);
                --mdc-checkbox-ink-color: var(--black);
            }

            .center-box {
                position: relative;
                top: 45%;
                left: 50%;
                transform: translate(-50%, 0%);
                text-align: center;
            }

	      .checkbox-row {
                position: relative;
		    display: flex;
		    align-items: center;
		    align-content: center;
		    font-family: Montserrat, sans-serif;
		    font-weight: 600;
		    color: var(--black);
	      }

            .q-button {
                display: inline-flex;
                flex-direction: column;
                justify-content: center;
                align-content: center;
                border: none;
                border-radius: 20px;
                padding-left: 25px;
                padding-right: 25px;
                color: white;
                background: #03a9f4;
                width: 50%;
                font-size: 17px;
                cursor: pointer;
                height: 50px;
                margin-top: 1rem;
                text-transform: uppercase;
                text-decoration: none;
                transition: all .2s;
                position: relative;
            }   
        `
    }

    constructor() {
        super()
        this.theme = localStorage.getItem('qortalTheme') ? localStorage.getItem('qortalTheme') : 'light'
        this.backupErrorMessage = ''
    }

    render() {
        return html`
                <div style="position: relative;" >
                    <div class="center-box">
                        <p>
                            ${translate("settings.choose")}
                        </p>
                        <div style="max-width: 500px; display: flex; justify-content: center; margin: auto;">
                            <mwc-icon style="padding: 10px; padding-left:0; padding-top: 42px;">password</mwc-icon>
                            <vaadin-password-field
                                style="width: 100%; color: var(--black);"
                                label="${translate("settings.password")}"
                                id="downloadBackupPassword"
                                helper-text="${translate("login.passwordhint")}"
                                autofocus
                            >
                            </vaadin-password-field>
                        </div>
                        <div style="text-align: center; color: var(--mdc-theme-error); text-transform: uppercase; font-size: 15px;">
                            ${this.backupErrorMessage}
                        </div>
                        <div style="max-width: 500px; display: flex; justify-content: center; margin: auto;">
                            <div @click=${() => this.checkForDownload()} class="q-button"> ${translate("settings.download")} </div>
                        </div>
                    </div>
                    <hr style="margin-top: 20px;">
                        <div class="checkbox-row">
                            <label for="authButton" id="authButtonLabel" style="color: var(--black);">
                                ${get('browserpage.bchange26')}
                            </label>
                            <mwc-checkbox style="margin-right: -15px;" id="authButton" @click=${(e) => this.checkForAuth(e)} ?checked=${store.getState().app.qAPPAutoAuth}></mwc-checkbox>
                    </div>
                    <div class="checkbox-row">
                            <label for="authButton" id="authButtonLabel" style="color: var(--black);">
                                ${get('browserpage.bchange39')}
                            </label>
                            <mwc-checkbox style="margin-right: -15px;" id="authButton" @click=${(e) => this.checkForLists(e)} ?checked=${store.getState().app.qAPPAutoLists}></mwc-checkbox>
                    </div>
                </div>
        `
    }

    stateChanged(state) {
    }

    checkForAuth(e) {
        if (e.target.checked) {
           store.dispatch(removeQAPPAutoAuth(false))
        } else {
           store.dispatch(allowQAPPAutoAuth(true))
        }
    }
    checkForLists(e) {
        if (e.target.checked) {
            store.dispatch(removeQAPPAutoLists(false))
        } else {
            store.dispatch(allowQAPPAutoLists(true))
        }
    }

    checkForDownload() {
        const checkPass = this.shadowRoot.getElementById('downloadBackupPassword').value
        if (checkPass === '') {
           this.backupErrorMessage = get("login.pleaseenter")
        } else if (checkPass.length < 8) {
           this.backupErrorMessage = get("login.lessthen8-2")
        } else {
            this.downloadBackup()
        }
    }

    async downloadBackup() {
        this.backupErrorMessage = ''
        const state = store.getState()
        const password = this.shadowRoot.getElementById('downloadBackupPassword').value
        const data = await state.app.wallet.generateSaveWalletData(password, state.config.crypto.kdfThreads, () => { })
        const dataString = JSON.stringify(data)
        const blob = new Blob([dataString], { type: 'text/plain;charset=utf-8' })
        FileSaver.saveAs(blob, `qortal_backup_${state.app.selectedAddress.address}.json`)
    }
}

window.customElements.define('security-view', SecurityView)
