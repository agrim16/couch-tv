package dev.couchtv.ontv

import android.content.Context
import android.graphics.*
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import org.json.JSONArray

/** A notepad box over whatever is on the TV. Strokes arrive from the phone as 0..1 coordinates. */
object Draw {
    private val main = Handler(Looper.getMainLooper())
    private var view: DrawView? = null
    private val hide = Runnable { clear() }
    private const val HIDE_MS = 120_000L

    fun show(strokes: JSONArray) {
        val ctx = App.instance
        if (!Settings.canDrawOverlays(ctx)) throw ApiError(409, "Couch TV is not allowed to draw over other apps yet. Open Couch TV and press Connect ADB.")
        val list = ArrayList<List<PointF>>()
        var total = 0
        for (i in 0 until minOf(strokes.length(), 400)) {
            val s = strokes.optJSONArray(i) ?: continue
            val pts = ArrayList<PointF>()
            for (j in 0 until s.length()) {
                val p = s.optJSONArray(j) ?: continue
                if (++total > 20000) break
                pts.add(PointF(p.optDouble(0).toFloat().coerceIn(0f, 1f), p.optDouble(1).toFloat().coerceIn(0f, 1f)))
            }
            if (pts.isNotEmpty()) list.add(pts)
        }
        main.post {
            val v = view ?: addView(ctx)
            v.strokes = list
            v.invalidate()
            main.removeCallbacks(hide)
            main.postDelayed(hide, HIDE_MS)
        }
    }

    fun clear() {
        main.post {
            main.removeCallbacks(hide)
            view?.let { runCatching { App.instance.getSystemService(WindowManager::class.java).removeView(it) } }
            view = null
        }
    }

    private fun addView(ctx: Context): DrawView {
        val wm = ctx.getSystemService(WindowManager::class.java)
        val dm = ctx.resources.displayMetrics
        val w = (dm.widthPixels * 0.42f).toInt()
        val lp = WindowManager.LayoutParams(w, w * 9 / 16, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE, PixelFormat.TRANSLUCENT)
        lp.gravity = Gravity.TOP or Gravity.END
        lp.x = dm.widthPixels / 40
        lp.y = dm.heightPixels / 20
        val v = DrawView(ctx)
        wm.addView(v, lp)
        view = v
        return v
    }
}

internal class DrawView(c: Context) : View(c) {
    var strokes: List<List<PointF>> = emptyList()
    private val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(235, 16, 16, 20) }
    private val pen = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(255, 245, 225); style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    override fun onDraw(canvas: Canvas) {
        val w = width.toFloat(); val h = height.toFloat()
        canvas.drawRoundRect(0f, 0f, w, h, h * 0.05f, h * 0.05f, bg)
        pen.strokeWidth = h * 0.012f
        for (s in strokes) {
            if (s.size == 1) { canvas.drawPoint(s[0].x * w, s[0].y * h, pen); continue }
            val path = Path()
            path.moveTo(s[0].x * w, s[0].y * h)
            for (i in 1 until s.size) path.lineTo(s[i].x * w, s[i].y * h)
            canvas.drawPath(path, pen)
        }
    }
}
