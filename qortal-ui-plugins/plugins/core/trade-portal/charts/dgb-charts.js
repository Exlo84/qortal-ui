import { LitElement, html, css } from 'lit'
import { render } from 'lit/html.js'
import { Epml } from '../../../../epml.js'
import { use, get, translate, translateUnsafeHTML, registerTranslateConfig } from 'lit-translate'

registerTranslateConfig({
	loader: lang => fetch(`/language/${lang}.json`).then(res => res.json())
})

import '@polymer/paper-dialog/paper-dialog.js'
import * as Highcharts from 'highcharts'
import Exporting from 'highcharts/modules/exporting'
Exporting(Highcharts)
import StockChart from 'highcharts/modules/stock'
StockChart(Highcharts)
import 'highcharts/highcharts-more.js'
import 'highcharts/modules/accessibility.js'
import 'highcharts/modules/boost.js'
import 'highcharts/modules/data.js'
import 'highcharts/modules/export-data.js'
import 'highcharts/modules/offline-exporting.js'

let dgbChartDialog

const parentEpml = new Epml({ type: 'WINDOW', source: window.parent })

class DgbCharts extends LitElement {
	static get properties() {
		return {
			isLoadingTradesChart: { type: Boolean },
			dgbTrades: { type: Array },
			dgbPrice: { type: Array }
		}
	}

	static get styles() {
		return css`
			.loadingContainer {
				height: 100%;
				width: 100%;
			}

			.trades-chart {
				color: var(--black);
				background: var(--white);
				border: 1px solid var(--black);
				border-radius: 25px;
				padding: 15px;
			}

			.chart-container {
				margin: auto;
				color: var(--black);
				text-align: center;
				padding: 15px;
				height: 30vh;
				width: 80vw;
			}

			.chart-info-wrapper {
				background: transparent;
				height: 38vh;
				width: 83vw;
				overflow: auto;
			}

			.chart-loading-wrapper {
				color: var(--black);
				background: var(--white);
				border: 1px solid var(--black);
				border-radius: 15px;
			}
		`
	}

	constructor() {
		super()
		this.theme = localStorage.getItem('qortalTheme') ? localStorage.getItem('qortalTheme') : 'light'
		this.isLoadingTradesChart = false
		this.dgbTrades = []
		this.dgbPrice = []
	}

	render() {
		return html`
			<paper-dialog id="loadChartDialog" class="chart-loading-wrapper" modal>
				<div class="loadingContainer" style="display:${this.isLoadingTradesChart ? 'inline-block' : 'none'}">
					<span style="color: var(--black);">${translate("login.loading")}</span>
				</div>
			</paper-dialog>
			<paper-dialog id="dgbChartDialog" class="chart-info-wrapper">
				<div class="chart-container">
					<div id='dgbStockPriceContainer' class='trades-chart'></div>
				</div>
			</paper-dialog>
		`
	}

	async firstUpdated() {
		this.changeTheme()
		this.changeLanguage()

		window.addEventListener('storage', () => {
			const checkLanguage = localStorage.getItem('qortalLanguage')
			const checkTheme = localStorage.getItem('qortalTheme')

			use(checkLanguage)

			this.theme = (checkTheme === 'dark') ? 'dark' : 'light'
			document.querySelector('html').setAttribute('theme', this.theme)
		})
	}

	async loadTradesChart() {
		this.isLoadingTradesChart = true
		this.shadowRoot.getElementById('loadChartDialog').open()
		await this.getDgbTrades()
		this.isLoadingTradesChart = false
		this.shadowRoot.getElementById('loadChartDialog').close()
		this.enableDgbStockPriceChart()
	}

	async getDgbTrades() {
		let currentDgbTimestamp = Date.now()
		const monthBackDgb = currentDgbTimestamp - 31556952000
            await parentEpml.request("apiCall", { url: `/crosschain/trades?foreignBlockchain=DIGIBYTE&minimumTimestamp=${monthBackDgb}&limit=0&reverse=false` }).then((res) => {
			this.dgbTrades = res
		})
		this.dgbPrice = this.dgbTrades.map(item => {
			const dgbSellPrice = this.round(parseFloat(item.foreignAmount) / parseFloat(item.qortAmount))
			return [item.tradeTimestamp, parseFloat(dgbSellPrice)]
		}).filter(item => !!item)
	}

	enableDgbStockPriceChart() {
            const dgbStockPriceData = this.dgbPrice
            const header = 'QORT / DGB ' + get("tradepage.tchange49")
		Highcharts.stockChart(this.shadowRoot.querySelector('#dgbStockPriceContainer'), {
			accessibility: {
				enabled: false
			},
			credits: {
				enabled: false
			},
			rangeSelector: {
				selected: 1,
				labelStyle: {color: 'var(--black)'},
				inputStyle: {color: '#03a9f4'}
			},
			chart: {
				backgroundColor: 'transparent'
			},
			title: {
				text: header,
				style: {color: 'var(--black)'}
			},
			xAxis: {
				labels: {
					style: {
						color: '#03a9f4'
					}
				}
			},
			yAxis: {
				labels: {
					style: {
						color: '#03a9f4'
					}
				}
			},
			series: [{
				name: 'QORT / DGB',
				data: dgbStockPriceData,
				tooltip: {
					valueDecimals: 8
				}
			}]
		})
	}

	async open() {
		await this.loadTradesChart()
		this.shadowRoot.getElementById('dgbChartDialog').open()
	}

	changeTheme() {
		const checkTheme = localStorage.getItem('qortalTheme')
		this.theme = (checkTheme === 'dark') ? 'dark' : 'light'
		document.querySelector('html').setAttribute('theme', this.theme);
	}

	changeLanguage() {
		const checkLanguage = localStorage.getItem('qortalLanguage')

		if (checkLanguage === null || checkLanguage.length === 0) {
			localStorage.setItem('qortalLanguage', 'us')
			use('us')
		} else {
			use(checkLanguage)
		}
	}

	round(number) {
		let result = (Math.round(parseFloat(number) * 1e8) / 1e8).toFixed(8)
		return result
	}
}

window.customElements.define('dgb-charts', DgbCharts)

const chartsdgb = document.createElement('dgb-charts')
dgbChartDialog = document.body.appendChild(chartsdgb)

export default dgbChartDialog