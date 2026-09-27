import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { DatePicker } from './ui/date-picker'
import { toast } from 'sonner'

export default function OrderForm({ open, onOpenChange, editingOrder, onSuccess }) {
  const [formData, setFormData] = useState({
    brand_name: '',
    note: '',
    publish_date: '',
    amount: '',
    status: '待结款',
    settlement_date: '',
    settlement_method: '支付宝',
    contact_pr: '',
    account_name: '',
    promo_cost: '',
    remark: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [brands, setBrands] = useState([])
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (editingOrder) {
      setFormData({
        brand_name: editingOrder.brand_name || '',
        note: editingOrder.note || '',
        publish_date: editingOrder.publish_date || '',
        amount: editingOrder.amount !== undefined ? String(editingOrder.amount) : '',
        status: editingOrder.status || '待结款',
        settlement_date: editingOrder.settlement_date || '',
        settlement_method: editingOrder.settlement_method || '支付宝',
        contact_pr: editingOrder.contact_pr || '',
        account_name: editingOrder.account_name || '',
        promo_cost: editingOrder.promo_cost !== undefined ? String(editingOrder.promo_cost) : '',
        remark: editingOrder.remark || '',
      })
    } else {
      setFormData({
        brand_name: '',
        note: '',
        publish_date: new Date().toISOString().slice(0, 10),
        amount: '',
        status: '待结款',
        settlement_date: '',
        settlement_method: '支付宝',
        contact_pr: '',
        account_name: '',
        promo_cost: '',
        remark: '',
      })
    }
  }, [editingOrder, open])

  useEffect(() => {
    if (open && window.api) {
      window.api.getBrands?.().then((res) => res && setBrands(res))
      window.api.getAccounts?.().then((res) => res && setAccounts(res))
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.brand_name.trim()) {
      toast.error('请输入品牌名称')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        promo_cost: parseFloat(formData.promo_cost) || 0,
        need_rebate: formData.status === '需返点' ? 1 : 0,
      }

      if (editingOrder?.id) {
        await window.api.updateOrder(editingOrder.id, payload)
        toast.success('商单更新成功')
      } else {
        await window.api.createOrder(payload)
        toast.success('商单创建成功')
      }
      onSuccess?.()
    } catch (err) {
      toast.error('保存失败: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingOrder ? '编辑商单' : '新建商单'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            完善商单品牌、笔记内容、结算金额与付款状态
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Row 1: Brand & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                品牌名称 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例如: wanatry / pedro"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                list="brand-list"
                required
              />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">合作笔记 / 明星</label>
              <Input
                placeholder="例如: 周也 / 红色毛衣穿搭"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          {/* Row 2: Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">发布日期</label>
              <DatePicker
                value={formData.publish_date}
                onChange={(val) => setFormData({ ...formData, publish_date: val })}
                placeholder="选择发布日期"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">商单金额 (¥)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: Status & Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">结款状态</label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择结款状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="待结款">待结款</SelectItem>
                  <SelectItem value="已结款">已结款</SelectItem>
                  <SelectItem value="需返点">需返点</SelectItem>
                  <SelectItem value="报备的">报备的</SelectItem>
                  <SelectItem value="待确认">待确认</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">所属账号</label>
              <Input
                placeholder="例如: 私服Style / Meet明星同款穿搭"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                list="account-list"
              />
              <datalist id="account-list">
                {accounts.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 4: Settlement info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">实际结款日期</label>
              <DatePicker
                value={formData.settlement_date}
                onChange={(val) => setFormData({ ...formData, settlement_date: val })}
                placeholder="未结款可留空"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">结款方式</label>
              <Select
                value={formData.settlement_method}
                onValueChange={(val) => setFormData({ ...formData, settlement_method: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择付款途径" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="支付宝">支付宝</SelectItem>
                  <SelectItem value="银行卡">银行卡</SelectItem>
                  <SelectItem value="微信支付">微信支付</SelectItem>
                  <SelectItem value="平台结算">小红书蒲公英 / 平台</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: PR & Promo cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">对接 PR 联络人</label>
              <Input
                placeholder="商务或 PR 微信/姓名"
                value={formData.contact_pr}
                onChange={(e) => setFormData({ ...formData, contact_pr: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">推广花费 (¥ 投流等)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.promo_cost}
                onChange={(e) => setFormData({ ...formData, promo_cost: e.target.value })}
              />
            </div>
          </div>

          {/* Row 6: Remark */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">备注备忘</label>
            <Textarea
              placeholder="记录返点要求、特殊付款约定或银行卡流水核对信息..."
              rows={2}
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : editingOrder ? '保存更新' : '立即创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
